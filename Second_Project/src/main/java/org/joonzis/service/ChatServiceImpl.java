package org.joonzis.service;

import org.joonzis.domain.ReportHistoryVO;
import org.joonzis.mapper.ChatMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChatServiceImpl implements ChatService {
	
	@Autowired private ChatMapper chatMapper;
	
	@Override
	public void reportHistory(ReportHistoryVO reportHistory) {
		chatMapper.reportHistory(reportHistory);
	}
}
