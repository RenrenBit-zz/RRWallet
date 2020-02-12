import { Alert } from "react-native";

//  https://www.cnblogs.com/cexm/p/7737538.html
export default {
  hasUpper(txt) {
    // 大写字母
    let reg = /(?=(?:.*?[A-Z]){1})/;
    return reg.test(txt);
  },
  hasLower(txt) {
    // 小写字母
    let reg = /(?=.*[a-z])/;
    return reg.test(txt);
  },
  hasNum(txt) {
    let reg = /(?=(?:.*?\d){1})/;
    return reg.test(txt);
  },
  hasSpec(txt) {
    let reg = /(?=(?:.*?[!@#$%*()_+^&}{:;?\,\<\>\/\.\\\]\[\=\-\|\"\'\~]){1})/;
    return reg.test(txt);
  },
  isStrongest(txt) {
    // 最强 至少8个字符，至少1个大写字母，1个小写字母，1个数字和1个特殊字符
    let reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/;
    return reg.test(txt || "");
  },
  isStrong(txt) {
    //强：至少8个字符，至少1个字母，1个数字和1个特殊字符：
    let reg = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/;
    return reg.test(txt || "");
  },
  isMiddle(txt) {
    //中：字母+数字，字母+特殊字符，数字+特殊字符
    let reg = /^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&*]+$)[a-zA-Z\d!@#$%^&*]+$/;
    return reg.test(txt || "");
  },
  isWeek(txt) {
    //弱：纯数字，纯字母，纯特殊字符
    let reg = /^(?:\d+|[a-zA-Z]+|[!@#$%^&*]+)$/;
    return reg.test(txt || "");
  },
  isDigit(txt) {
    let reg = /^[0-9]{1,42}$/g;
    return reg.test(txt || "");
  },
  getLevel(txt) {
    let isDigit = this.isDigit(txt);

    let level = 0;

    if (txt.length < 6) {
      level = 0;
    } else {
      let hasUpper = this.hasUpper(txt);
      let hasLower = this.hasLower(txt);
      let hasNum = this.hasNum(txt);
      let hasSpec = this.hasSpec(txt);
      let arr = [hasUpper, hasLower, hasNum, hasSpec];
      for (let n of arr) {
        if (n) {
          level++;
        }
      }
    }
    return level;
  },
  // getLevel(txt){
  //     let isDigit = this.isDigit(txt);
  //     let isWeek = this.isWeek(txt);
  //     let isMiddle = this.isMiddle(txt);
  //     let isStrong = this.isStrong(txt);
  //     let isStrongest = this.isStrongest(txt);

  //     let level = 0;
  //     if(isDigit || txt.length < 8){
  //         level = 0;
  //     }else if(isWeek){
  //         level = 1;
  //     }else if(isStrongest){
  //         level = 4;
  //     }else if(isStrong){
  //         level = 3;
  //     }else if(isMiddle){
  //         level = 2;
  //     }
  //     return level;
  // },
  checkPasswordWithTip(pwd, repwd) {
    pwd = pwd || "";

    if (pwd.indexOf(" ") != -1) {
      Alert.alert("", "密码不能包含空格");
      return false;
    }
    if (pwd.length < 8 || pwd.length > 42) {
      Alert.alert("", "密码长度至少8位，最多42位");
      return false;
    }

    if (this.getLevel(pwd) < 2) {
      Alert.alert("", "密码必须包含：字母、数字、符号中的至少两种");
      return false;
    }

    if (!(pwd === repwd)) {
      Alert.alert("", "两次密码不一致");
      return false;
    }

    return true;
  },
};

//  (?=^.{8, 42}$)(?=(?:.*?\d){2})(?=.*[a-z])(?=(?:.*?[A-Z]){2})(?=(?:.*?[!@#$%*()_+^&}{:;?.]){1})(?!.*\s)[0-9a-zA-Z!@#$%*()_+^&]*$

/**

方案一

至少8-16个字符，至少1个大写字母，1个小写字母和1个数字，其他可以是任意字符：

/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,16}$/

或者：

/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\s\S]{8,16}$/

其中 [\s\S] 中的\s空白符，\S非空白符，所以[\s\S]是任意字符。也可以用 [\d\D]、[\w\W]来表示。

至少8个字符，至少1个大写字母，1个小写字母和1个数字,不能包含特殊字符（非数字字母）：

^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$

至少8个字符，至少1个字母，1个数字和1个特殊字符：

^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$

至少8个字符，至少1个大写字母，1个小写字母和1个数字：

^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$

至少8个字符，至少1个大写字母，1个小写字母，1个数字和1个特殊字符：

^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}

最少8个最多十个字符，至少1个大写字母，1个小写字母，1个数字和1个特殊字符：

^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,10}

方案二

还有，你可以使用这个正则表达式：

^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$

这个正则表达式将强制执行这些规则：

至少1个大写字母English letter，(?=.*?[A-Z])
至少1个小写英文字母，(?=.*?[a-z])
至少1位数字，(?=.*?[0-9])
至少有1个特殊字符，(?=.*?[#?!@$%^&*-])
最小8个长度.{8,}
方案三

正则表达式没有AND运算符，所以编写正则表达式与有效密码匹配是非常困难的，当有效性被某些东西和其他东西等定义时…

但是，正则表达式确实有1个OR运算符，所以只需应用DeMorgan的定理，并编写1个与无效密码相匹配的正则表达式：

任何少于8个字符或任何没有数字或任何没有大写字母或任何没有小写字母或任何没有特殊字符的任何东西。

所以：^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*|[a-zA-Z0-9]*)$，如果有什么匹配的话，这是1个无效的密码。

方案四

由于特殊字符仅限于键盘中的特殊字符，因此可用于任何特殊字符：

^(?=.*?[A-Z])(?=(.*[a-z]){1,})(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$

这个正则表达式将强制执行这些规则：
– 至少1个大写英文字母
– 至少1个小写英文字母
– 至少1位数字
– 至少1个特殊字符
– 最少8个长度

方案五

根据我的情况，我遇到了最受欢迎的答案。例如，我的验证失败，其中包含;或[等字符。我对 white-listing 我的特殊字符不感兴趣，所以我用[^\w\s]作为测试 – 简单地把非字符(包括数字)和非空格字符放在一起。总而言之，这是对我有用的

至少8字符
至少1数字字符
至少1小写字母
至少1大写字母
至少1特殊字符
/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/ 简单演示涵盖各种情况

方案六

导入JavaScript文件jquery.validate.min.js。

您可以使用此方法：

JavaScript 代码:
$.validator.addMethod("pwcheck", function (value) {
return /[\@\#\$\%\^\&\*\(\)\_\+\!]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[A-Z]/.test(value)
});
至少1个大写英文字母
至少1个小写英文字母
至少1位数字
至少1个特殊字符
方案七

尝试这个：
– 最少6个字符
– 至少有1个大写字符
– 至少1个小写字符
– 至少1个特殊字符

表达式：

/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&.])[A-Za-z\d$@$!%*?&.]{6, 20}/

可选特殊字符：

至少1个特殊字符
至少1个数字
特殊字符是可选的
最少6个字符，最多16个字符
表达式：

/^(?=.*\d)(?=.*[a-zA-Z]).{6,20}$/

如果不需要最小和最大条件，则删除.{6, 16}
– 6是最小字符数限制
– 20是最大字符限制
– ?=表示匹配表达式

 */
