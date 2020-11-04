/**
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.gravitee.repository.jdbc.common;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import io.gravitee.repository.jdbc.exception.DatabaseInitializationException;
import liquibase.Contexts;
import liquibase.Liquibase;
import liquibase.database.jvm.JdbcConnection;
import liquibase.resource.ClassLoaderResourceAccessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

/**
 *
 * @author njt
 */
public abstract class AbstractJdbcRepositoryConfiguration implements ApplicationContextAware {

    private static final Logger LOGGER = LoggerFactory.getLogger(AbstractJdbcRepositoryConfiguration.class);

    private static final boolean DEFAULT_AUTO_COMMIT = true;
    private static final long DEFAULT_CONNECTION_TIMEOUT = 10000;
    private static final long DEFAULT_IDLE_TIMEOUT = 600000;
    private static final long DEFAULT_MAX_LIFETIME = 1800000;
    private static final int DEFAULT_MIN_IDLE = 10;
    private static final int DEFAULT_MAX_POOL_SIZE = 10;
    private static final boolean DEFAULT_REGISTER_MBEANS = true;
    private static final boolean LIQUIBASE_ENABLED = true;

    @Autowired
    private Environment env;

    // Default escape char for reserved keywords
    private static char escapeReservedWordsPrefixChar = '`';
    private static char escapeReservedWordsSufixChar = '`';

    private static final String POSTGRESQL_DRIVER_TYPE = "postgresql";
    private static final String SQLSERVER_DRIVER_TYPE = "sqlserver";

    private static final String DEFAULT_PAGING_QUERY = "LIMIT %d OFFSET %d ";
    private static final String MSSQL_PAGING_QUERY = "OFFSET %d ROWS FETCH NEXT %d ROWS ONLY ";

    private static String pagingQuery = DEFAULT_PAGING_QUERY;

    public static String escapeReservedWord(final String word) {
        return escapeReservedWordsPrefixChar + word + escapeReservedWordsSufixChar;
    }

    public static String createPagingClause(final int limit, final int offset) {
        if (pagingQuery.startsWith("OFFSET")) {
            return String.format(pagingQuery, offset, limit);
        } else {
            return String.format(pagingQuery, limit, offset);
        }
    }

    @Override
    public void setApplicationContext(final ApplicationContext applicationContext) {
        LOGGER.debug("AbstractJdbcRepositoryConfiguration.setApplicationContext({})", applicationContext);
        final ConfigurableApplicationContext appContext;
        final ApplicationContext applicationContextParent = applicationContext.getParent();
        if (applicationContextParent == null) {
            appContext = (ConfigurableApplicationContext) applicationContext;
        } else {
            appContext = (ConfigurableApplicationContext) applicationContextParent;
        }
        final Map<String, DataSource> dataSources = appContext.getBeansOfType(DataSource.class);
        if (dataSources.isEmpty()) {
            final ConfigurableListableBeanFactory beanFactory = appContext.getBeanFactory();
            final DataSource dataSource = graviteeDataSource();
            beanFactory.registerSingleton("graviteeDataSource", dataSource);
            beanFactory.registerSingleton("graviteeTransactionManager", new DataSourceTransactionManager(dataSource));
        }
    }

    private synchronized DataSource graviteeDataSource() {
        final HikariConfig dsConfig = new HikariConfig();
        dsConfig.setPoolName("gravitee-jdbc-pool-1");

        final String jdbcUrl = readPropertyValue("jdbc.url");
        setEscapeReservedWordFromJDBCUrl(jdbcUrl);

        dsConfig.setJdbcUrl(jdbcUrl);
        dsConfig.setUsername(readPropertyValue("jdbc.username"));
        dsConfig.setPassword(readPropertyValue("jdbc.password", false));
        // Pooling
        dsConfig.setAutoCommit(readPropertyValue("jdbc.pool.autoCommit", Boolean.class, DEFAULT_AUTO_COMMIT));
        dsConfig.setConnectionTimeout(readPropertyValue("jdbc.pool.connectionTimeout", Long.class, DEFAULT_CONNECTION_TIMEOUT));
        dsConfig.setIdleTimeout(readPropertyValue("jdbc.pool.idleTimeout", Long.class, DEFAULT_IDLE_TIMEOUT));
        dsConfig.setMaxLifetime(readPropertyValue("jdbc.pool.maxLifetime", Long.class, DEFAULT_MAX_LIFETIME));
        dsConfig.setMinimumIdle(readPropertyValue("jdbc.pool.minIdle", Integer.class, DEFAULT_MIN_IDLE));
        dsConfig.setMaximumPoolSize(readPropertyValue("jdbc.pool.maxPoolSize", Integer.class, DEFAULT_MAX_POOL_SIZE));
        dsConfig.setRegisterMbeans(readPropertyValue("jdbc.pool.registerMbeans", Boolean.class, DEFAULT_REGISTER_MBEANS));

        final DataSource dataSource = new HikariDataSource(dsConfig);

        Boolean liquibase = readPropertyValue("jdbc.liquibase", Boolean.class, LIQUIBASE_ENABLED);
        if (liquibase) {
            runLiquibase(dataSource);
        }

        return dataSource;
    }

    protected abstract String getScope();

    public static void setEscapeReservedWordFromJDBCUrl(final String jdbcUrl) {
        if (jdbcUrl != null) {
            String[] tokenizedJdbcUrl = jdbcUrl.split(":");
            String databaseType = tokenizedJdbcUrl[1];
            //for TestContainers
            if ("tc".equals(databaseType)) {
                databaseType = tokenizedJdbcUrl[2];
            }

            switch (databaseType) {
                case POSTGRESQL_DRIVER_TYPE:
                    escapeReservedWordsPrefixChar = '\"';
                    escapeReservedWordsSufixChar = '\"';
                    break;
                case SQLSERVER_DRIVER_TYPE:
                    escapeReservedWordsPrefixChar = '[';
                    escapeReservedWordsSufixChar = ']';
                    pagingQuery = MSSQL_PAGING_QUERY;
                    break;
            }
        }
    }

    @Bean
    public JdbcTemplate graviteeJdbcTemplate(final DataSource dataSource) {
        LOGGER.debug("AbstractJdbcRepositoryConfiguration.graviteeJdbcTemplate()");
        return new JdbcTemplate(dataSource);
    }

    private void runLiquibase(DataSource dataSource) {
        LOGGER.debug("Running Liquibase on {}", dataSource);

        System.setProperty("liquibase.databaseChangeLogTableName", "databasechangelog");
        System.setProperty("liquibase.databaseChangeLogLockTableName", "databasechangeloglock");

        try (Connection conn = dataSource.getConnection()) {
            final Liquibase liquibase = new Liquibase("liquibase/master.yml"
                    , new ClassLoaderResourceAccessor(this.getClass().getClassLoader()), new JdbcConnection(conn));
            liquibase.setIgnoreClasspathPrefix(true);
            liquibase.update((Contexts) null);
        } catch (Exception ex) {
            throw new DatabaseInitializationException("Failed to set up database", ex) ;
        }
    }

    private String readPropertyValue(String propertyName) {
        return readPropertyValue(propertyName, true);
    }

    private String readPropertyValue(String propertyName, final boolean displayOnLog) {
        return readPropertyValue(propertyName, String.class, null, displayOnLog);
    }

    private <T> T readPropertyValue(String propertyName, Class<T> propertyType, T defaultValue) {
        return readPropertyValue(propertyName, propertyType, defaultValue, true);
    }

    private <T> T readPropertyValue(String propertyName, Class<T> propertyType, T defaultValue, final boolean displayOnLog) {
        final String scope = getScope();
        final T value = env.getProperty(scope + "." + propertyName, propertyType, defaultValue);
        LOGGER.debug("Reading property {}: {}", propertyName, displayOnLog ? value : "********");
        return value;
    }
}