package org.joonzis.mapper;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.QuestionDTO;
import org.joonzis.domain.UsersVO;

@Mapper
public interface AdminMapper {

    //문제 등록 메소드
	void insertQuestion(QuestionDTO questionDTO);
    
    //문제 검색 메소드
    List<QuestionDTO> getQuestionsBySearch(Map<String, Object> params);
    int getTotalQuestionCount(Map<String, Object> params);
    
    //문제 수정 메소드
    void updateQuestion(QuestionDTO questionDTO);
    
    //문제 삭제 메소드
    int deleteQuestions(Map<String, Object> params);
    
    //유저 검색 메소드
	List<UsersVO> selectAllUsers();
	List<UsersVO> searchUsers(@Param("searchType")String searchType, @Param("searchValue")String searchValue);
	
	//유저 채금 확인/적용/해제메소드
	List<UsersVO> getUsersChatBanStatus(@Param("userNos") List<Integer> userNos);
	int updateChatBanStatus(@Param("userNos") List<Integer> userNos, @Param("bannedTimestamp") Timestamp bannedTimestamp);
	int unbanChatUsers();
	
	//업적 등록 메소드
	void insertAchievement(AchievementDTO achievementDTO);
	
	//업적 검색 메소드
	List<AchievementDTO> searchAchievements(Map<String, Object> params);
	int getTotalAchievementCount(Map<String, Object> params);
	
	//업적 삭제 메소드
	int deleteAchievementsByTitles(Map<String, Object> params);
	
	//아이템 등록 메소드
	void insertItem(ItemVO itemVO);
	
	//아이템 검색 메소드
	int getTotalItemCount(Map<String, Object> params);
	List<ItemVO> searchItems(Map<String, Object> params);
	
	//아이템 수정 메소드
	int updateItem(ItemVO itemVO);
	
	//아이템 삭제 메소드
	void deleteItems(Map<String, Object> params);

}