package org.joonzis.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@ToString
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GameRoomDTO {
	private String gameroom_no;
    private String title;
    private String category;
    private String game_mode;
    private String is_private;
    private int limit;
    private String pwd;
}