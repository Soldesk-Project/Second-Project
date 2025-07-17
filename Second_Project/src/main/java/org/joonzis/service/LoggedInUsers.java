package org.joonzis.service;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class LoggedInUsers {
	private ConcurrentHashMap<String, Boolean> loggedInUsers = new ConcurrentHashMap<>();

    public boolean isLoggedIn(String userId) {
        return loggedInUsers.getOrDefault(userId, false);
    }

    public void addUser(String userId) {
        loggedInUsers.put(userId, true);
    }

    public void removeUser(String userId) {
        loggedInUsers.remove(userId);
    }
}
