package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;
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
	public List<UserInfoDecoDTO> getUserRankingList() {
		return mapper.getUserRankingList();
	}
	
	@Override
	public List<ItemVO> getItemList() {
		return mapper.getItemList();
	}
	
	@Override
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO) {
		return mapper.updateItem(UserDecoUpdateDTO);
	}
}
