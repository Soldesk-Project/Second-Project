package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.ItemVO;

public interface ShopMapper {
	
	// 상점 - 카테고리별 아이템 목록
	public List<ItemVO> getItemCategory(String category);
}
