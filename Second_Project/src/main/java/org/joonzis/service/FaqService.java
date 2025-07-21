package org.joonzis.service;

import java.util.Map;
import org.joonzis.domain.FaqVO;

public interface FaqService {
    Map<String,Object> getFaqs(int page, int size);
    FaqVO findById(Long id);
    void createFaq(FaqVO faq);
}