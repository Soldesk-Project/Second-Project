package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.mapper.AchievementMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AchievementServiceImpl implements AchievementService{
	
	@Autowired
	private AchievementMapper mapper;
	
	// 업적 리스트
	@Override
	public List<AchievementDTO> getAchievementList(int user_no) { return mapper.getAchievementList(user_no); }
	
	// 유저업적 저장
	@Override
	public int addUserAchievement(AchievementDTO dto) { return mapper.addUserAchievement(dto); }

}
