package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.UsersDTO;
import org.joonzis.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.log4j.Log4j;

@Log4j
@Service
public class UserServiceImpl implements UserService{
	
	@Autowired
	private UserMapper mapper;	

	@Override
	public List<UsersDTO> getUserRankingList() {
		log.info("getUserRankingList...");
		return mapper.getUserRankingList();
	}
}
