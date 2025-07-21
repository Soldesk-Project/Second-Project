package org.joonzis.service;

import java.util.Map;
import org.joonzis.domain.NoticeVO;

public interface NoticeService {
    Map<String,Object> getNotices(int page, int size);
    NoticeVO findById(Long id);
    void createNotice(NoticeVO notice);
}