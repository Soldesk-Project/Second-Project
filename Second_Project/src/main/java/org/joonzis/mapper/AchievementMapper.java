package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.AchievementVO;

public interface AchievementMapper {
	
	// 업적 리스트
	public List<AchievementVO> getAchievementList();

}
