package org.joonzis.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.joonzis.domain.NoticeVO;
import org.joonzis.mapper.NoticeMapper;
import org.joonzis.service.NoticeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NoticeServiceImpl implements NoticeService {

    @Autowired private NoticeMapper mapper;

    @Override
    public Map<String,Object> getNotices(int page, int size) {
        int offset = (page - 1) * size;
        List<NoticeVO> items = mapper.selectNotices(offset, size);
        int totalCount = mapper.countNotices();
        Map<String,Object> result = new HashMap<>();
        result.put("items", items);
        result.put("totalCount", totalCount);
        return result;
    }

    @Override
    public NoticeVO findById(Long id) {
        return mapper.selectById(id);
    }

    @Transactional
    @Override
    public void createNotice(NoticeVO notice) {
        mapper.insertNotice(notice);
    }
}