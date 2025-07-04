package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;

public interface UserService {
	
	// 유저 랭킹 리스트
	public List<UserInfoDecoDTO> getUserRankingList();
	
	// 아이템 겟 테스트
	public List<ItemVO> getItemList();

	// 아이템 업데이트 테스트	
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO);
	
	// userNo로 유저 정보+css 찾기	
	public UserInfoDecoDTO getUserInfoByUserNo(int userNo);
}
