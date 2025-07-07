package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.AchievementVO;
import org.joonzis.mapper.AchievementMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AchievementServiceImpl implements AchievementService{
	
	@Autowired
	private AchievementMapper mapper;
	
	@Override
	public List<AchievementVO> getAchievementList() {
		return mapper.getAchievementList();
	}

}
