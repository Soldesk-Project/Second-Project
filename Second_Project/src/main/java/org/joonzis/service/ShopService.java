package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ItemVO;

public interface ShopService {
	// 여러 카테고리 한번에 조회하는 메서드 추가
    public List<ItemVO> getItemsByCategories(List<String> categories);
}
