package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDecoDTO;

public interface UserMapper {

	// 유저 랭킹 리스트
	public List<UserInfoDecoDTO> getUserRankingList();
	
	// 아이템 테스트
	public List<ItemVO> getItemList();
	
	// 아이템 업데이트 테스트	
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO);	
}
