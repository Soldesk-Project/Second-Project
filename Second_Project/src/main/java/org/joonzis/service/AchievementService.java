package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.AchievementVO;

public interface AchievementService {
	
	// 업적 리스트
	public List<AchievementVO> getAchievementList();
}
