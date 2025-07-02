package org.joonzis.config;

import java.io.IOException;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

public class RedisAutoStarter implements ServletContextListener {

    private Process redisProcess;

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        try {
            String redisPath = "C:\\Program Files\\Redis\\redis-server.exe";
            String redisConf = "C:\\Program Files\\Redis\\redis.windows.conf";
            ProcessBuilder builder = new ProcessBuilder(redisPath, redisConf);
            builder.inheritIO();
            redisProcess = builder.start();
            System.out.println("✅ Redis 서버 실행됨");
        } catch (IOException e) {
            System.err.println("❌ Redis 실행 실패: " + e.getMessage());
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        if (redisProcess != null && redisProcess.isAlive()) {
            redisProcess.destroy();
            System.out.println("🛑 Redis 서버 종료됨");
        }
    }
}
