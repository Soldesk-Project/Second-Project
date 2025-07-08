package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ItemVO;

public interface ShopService {
	
	// 카테고리 아이템 겟
	public List<ItemVO> getItemCategory(String category);
}
