package org.joonzis.service;

import java.util.List;

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
	
	@Override
	public List<ReportHistoryVO> getReportHistory(int offset, int size) {
		return chatMapper.getReportHistory(offset, size);
	}
	
	@Override
	public int getReportHistoryCount() {
		return chatMapper.getReportHistoryCount();
	}
	
	
}
