package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ItemVO;

public interface ShopService {
	
	// 상점 - 카테고리별 아이템 목록
	public List<ItemVO> getItemCategory(String category);
}
