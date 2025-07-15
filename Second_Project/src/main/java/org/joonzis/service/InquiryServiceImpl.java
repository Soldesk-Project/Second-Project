package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.joonzis.domain.InquiryVO;
import org.joonzis.mapper.InquiryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InquiryServiceImpl implements InquiryService {
	@Autowired
    private InquiryMapper inquiryMapper;

    @Override
    public Map<String, Object> getInquiries(int page, int size) {
        int offset = (page - 1) * size;
        List<InquiryVO> items = inquiryMapper.selectInquiries(offset, size);
        int totalCount = inquiryMapper.countInquiries();

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        result.put("totalCount", totalCount);
        return result;
    }

    @Override
    public void createInquiry(Long userId, String subject, String message) {
        InquiryVO vo = InquiryVO.builder()
                                .userId(userId)
                                .subject(subject)
                                .message(message)
                                .build();
        inquiryMapper.insertInquiry(vo);
    }
    
    @Override
    public InquiryVO findById(Long id) {
      return inquiryMapper.selectById(id);
    }
}
