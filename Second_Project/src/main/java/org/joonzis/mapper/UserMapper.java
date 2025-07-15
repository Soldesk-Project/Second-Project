package org.joonzis.mapper;

import java.util.List;
import java.util.Map;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserAchievementDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.domain.UserRewardVO;

public interface UserMapper {

	// 유저 랭킹 리스트
	public List<UserInfoDecoDTO> getUserRankingList();
	
	// 아이템 테스트
	public List<ItemVO> getItemList();
	
	// 아이템 업데이트 테스트	
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO);
	
	// userNo로 유저 정보+css 찾기
	public UserInfoDecoDTO getUserInfoByUserNo(int userNo);
	
	// 업적 달성 포인트 추가
	public int updateUserPoint(UserAchievementDTO dto);
	
	// 인벤토리 카테고리별 가져오기
	public List<ItemVO> getInventoryCategory(Map<String, Object> paramMap);
	
	// 인벤토리 가져오기
	public List<ItemVO> getInventory(int user_no);
	
	// 유저 point minus
	public boolean userPointMinus(Map<String, Object> paramMap);
	
	// 아이템 유저 인벤토리 저장
	public boolean buyItemInventory(Map<String, Object> paramMap);
	
	// 리워드 추가하기
	public boolean addReward(UserDecoUpdateDTO UserDecoUpdateDTO);
	
	// 리워드 상태 가져오기
	public UserRewardVO getRewardStatus(int user_no);
	
	// 리워드 상태 업데이트하기
	public boolean rewardUpdate(UserRewardVO UserRewardVO);
}
