package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.AchievementDTO;

public interface AchievementMapper {
	
	// 업적 리스트
	public List<AchievementDTO> getAchievementList(int user_no);
	
	// 유저업적 저장
	public int addUserAchievement(AchievementDTO dto);

}
