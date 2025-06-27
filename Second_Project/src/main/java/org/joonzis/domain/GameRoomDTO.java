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
    private int gameroom_no;      // NUMBER
    private String title;         // VARCHAR2(50)
    private String category;      // VARCHAR2(50)
    private String game_mode;          // VARCHAR2(10)
    private String is_private;     // CHAR(1) - 'Y' 또는 'N'
    private String pwd;  // VARCHAR2(50)
}