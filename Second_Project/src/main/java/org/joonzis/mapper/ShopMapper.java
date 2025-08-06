package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.ItemVO;

public interface ShopMapper {
	// 여러 카테고리 한번에 조회하는 메서드 추가
    public List<ItemVO> getItemsByCategories(List<String> categories);
}
