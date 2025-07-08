package org.joonzis.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserAchievementDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import lombok.extern.log4j.Log4j;

@Log4j
@Service
public class UserServiceImpl implements UserService{
	
	private final Map<Integer, String> userServerMap = new ConcurrentHashMap<>();
	
	@Autowired
	private UserMapper mapper;	

	// 유저 랭킹 리스트
	@Override
	public List<UserInfoDecoDTO> getUserRankingList() {
		return mapper.getUserRankingList();
	}
	
	// 아이템 겟 테스트
	@Override
	public List<ItemVO> getItemList() {
		return mapper.getItemList();
	}
	
	// 아이템 업데이트 테스트	
	@Override
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO) {
		return mapper.updateItem(UserDecoUpdateDTO);
	}
	
	// userNo로 유저 정보+css 찾기	
	@Override
	public UserInfoDecoDTO getUserInfoByUserNo(int userNo) {
		return mapper.getUserInfoByUserNo(userNo);
	}
	
	// 업적 달성 포인트 추가
	@Override
	public int updateUserPoint(UserAchievementDTO dto) {
		return mapper.updateUserPoint(dto);
	}
}
