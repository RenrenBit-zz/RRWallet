import Storage from "react-native-storage";
import { AsyncStorage } from "react-native";

const storage = new Storage({
  // 最大容量，默认值1000条数据循环存储
  size: 1000,

  // 存储引擎：对于rn使用asyncstorage，对于web使用window.localstorage
  // 如果不指定则数据只会保存在内存中，重启后即丢失
  storageBackend: AsyncStorage,

  // 数据过期时间，默认一整天（1000 * 3600 * 24 毫秒），设为null则永不过期
  defaultExpires: null,

  // 读写时在内存中缓存数据。默认启用。
  enableCache: true,
});

// 缓存key
// !!!!注意，key中不要用_下划线字符，否则在key-id的存储形式下有问题
const STORAGE_KEY = {
  CONTACT_LIST: "contactList", // 联系人列表
  APP_INFO: "appinfo", // app信息
};

// api 使用参见https://github.com/sunnylqm/react-native-storage/blob/master/README-CHN.md
//
export default storage;
export { STORAGE_KEY };
