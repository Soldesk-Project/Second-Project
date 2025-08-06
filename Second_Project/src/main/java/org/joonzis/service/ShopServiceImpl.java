package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.ItemVO;
import org.joonzis.mapper.ShopMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ShopServiceImpl implements ShopService {
	
	@Autowired
	private ShopMapper mapper;
	
	// 여러 카테고리를 받아 한번에 조회
    @Override
    public List<ItemVO> getItemsByCategories(List<String> categories) {
        return mapper.getItemsByCategories(categories);
    }
}
