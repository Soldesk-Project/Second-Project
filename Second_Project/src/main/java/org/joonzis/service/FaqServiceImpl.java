package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.joonzis.domain.FaqVO;
import org.joonzis.mapper.FaqMapper;
import org.joonzis.service.FaqService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FaqServiceImpl implements FaqService {

    @Autowired private FaqMapper mapper;

    @Override
    public Map<String,Object> getFaqs(int page, int size) {
        int offset = (page - 1) * size;
        List<FaqVO> items = mapper.selectFaqs(offset, size);
        int totalCount = mapper.countFaqs();
        Map<String,Object> result = new HashMap<>();
        result.put("items", items);
        result.put("totalCount", totalCount);
        return result;
    }

    @Override
    public FaqVO findById(Long id) {
        return mapper.selectById(id);
    }

    @Transactional
    @Override
    public void createFaq(FaqVO faq) {
        mapper.insertFaq(faq);
    }
}