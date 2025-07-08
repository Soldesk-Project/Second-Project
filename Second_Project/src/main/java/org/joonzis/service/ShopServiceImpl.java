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
	
	@Override
	public List<ItemVO> getItemCategory(String category) {
		return mapper.getItemCategory(category);
	}
}
