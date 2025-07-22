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
public class ItemVO {
	private int item_no;
	private int item_price;
	
	private String item_name;
	private String item_type;
//	private String css_class_name;
	private String imageFileName;
}
