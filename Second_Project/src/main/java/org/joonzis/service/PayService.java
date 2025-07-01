package org.joonzis.service;

public interface PayService {
	String ready(String userId, int amount) throws Exception;
    String approve(String... params) throws Exception;
}
