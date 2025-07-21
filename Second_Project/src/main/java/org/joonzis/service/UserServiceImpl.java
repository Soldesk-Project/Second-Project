package org.joonzis.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserAchievementDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.domain.UserRewardVO;
import org.joonzis.domain.UsersVO;
import org.joonzis.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.log4j.Log4j;

@Log4j
@Service
public class UserServiceImpl implements UserService{
	
	private final Map<Integer, String> userServerMap = new ConcurrentHashMap<>();
	
	@Autowired
	private UserMapper mapper;	

	// Top 10 유저 랭킹 목록
	@Override
	public List<UserInfoDecoDTO> getUserRankingList() {
		return mapper.getUserRankingList();
	}
	
	// 모든 아이템 목록
	@Override
	public List<ItemVO> getItemList() {
		return mapper.getItemList();
	}
	// 인벤토리 - 카테고리별 아이템 목록
	public List<ItemVO> getInventoryCategory(Map<String, Object> paramMap) {
		return mapper.getInventoryCategory(paramMap);
	}
	// 보유 아이템 목록
	@Override
	public List<ItemVO> getInventory(int user_no) {
		return mapper.getInventory(user_no);
	}
	
	// 유저 장식 업데이트	
	@Override
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO) {
		return mapper.updateItem(UserDecoUpdateDTO);
	}
	
	// userNo로 유저 정보+css 찾기	
	@Override
	public UserInfoDecoDTO getUserInfoByUserNo(int userNo) {
		return mapper.getUserInfoByUserNo(userNo);
	}
	
	// 업적 달성 - 포인트 추가
	@Override
	public int updateUserPoint(UserAchievementDTO dto) {
		return mapper.updateUserPoint(dto);
	}
	
	
	// 아이템 구매 - 포인트 감소
	@Override
	public boolean userPointMinus(Map<String, Object> paramMap) {
		return mapper.userPointMinus(paramMap);
	}
	// 아이템 구매 - 인벤토리에 추가
	@Override
	public boolean buyItemInventory(Map<String, Object> paramMap) {
		return mapper.buyItemInventory(paramMap);
	}
	
	// 리워드 상태
	@Override
	public UserRewardVO getRewardStatus(int user_no) {
		return mapper.getRewardStatus(user_no);
	}
	// 리워드 상태 업데이트
	@Override
	public boolean rewardUpdate(UserRewardVO UserRewardVO) {
		return mapper.rewardUpdate(UserRewardVO);
	}
	// 리워드 보상 획득
	@Override
	public boolean addReward(UserDecoUpdateDTO UserDecoUpdateDTO) {
		return mapper.addReward(UserDecoUpdateDTO);
	}
	
	// 회원가입 - 닉네임 중복 확인
	@Override
	public boolean isUserNickTaken(String user_nick) {
		return mapper.isUserNickTaken(user_nick) == 1;
	}
	// 회원가입 - 아이디 중복 확인
	@Override
	public boolean isUserIdTaken(String user_id) {
		return mapper.isUserIdTaken(user_id) == 1;
	}
	// 회원가입 - 이메일 중복 확인
	@Override
	public boolean isUserEmailTaken(String user_email) {
		return mapper.isUserEmailTaken(user_email) == 1;
	}
	
	// 아이디 찾기
	@Override
	public String findIdByEmail(String user_email) {
		return mapper.findIdByEmail(user_email);
	}
	// 비밀번호 찾기
	@Override
	public String findPwByIdAndEmail(UsersVO vo) {
		return mapper.findPwByIdAndEmail(vo);
	}
	
	// 유저 닉네임 변경
	public void updateNickname(Long user_no, String user_nick) {
		mapper.updateNickname(user_no, user_nick);
    }
	
	@Override
	@Transactional
	public int changeProfileImage(int userNo, String imageUrl) {
		int updated = mapper.updateProfileImage(userNo, imageUrl);
	    log.info("프로필 이미지 업데이트 건수: " + updated);
	    if (updated != 1) {
	      throw new IllegalStateException("프로필 이미지 업데이트 실패: userNo=" + userNo);
	    }
	    return updated;
	  }
	
	@Override
    public UsersVO getUsersByUserNo(int userNo) {
        return mapper.getUsersByUserNo(userNo);
    }
}
