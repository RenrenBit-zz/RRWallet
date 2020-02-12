package com.renrenbit.rrwallet.utils;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;


public class RNUtils {
    public static WritableMap convertJsonToMap(JSONObject jsonObject) throws JSONException {
        WritableMap map = new WritableNativeMap();

        Iterator<String> iterator = jsonObject.keys();
        while (iterator.hasNext()) {
            String key = iterator.next();
            if (jsonObject.isNull(key)) {
                map.putNull(key);
                continue;
            }
            Object value = jsonObject.get(key);
            if (value instanceof JSONObject) {
                map.putMap(key, convertJsonToMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                map.putArray(key, convertJsonToArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                map.putBoolean(key, (Boolean) value);
            } else if (value instanceof Integer) {
                map.putInt(key, (Integer) value);
            } else if (value instanceof Double) {
                map.putDouble(key, (Double) value);
            } else if (value instanceof String) {
                map.putString(key, (String) value);
            } else {
                map.putString(key, value.toString());
            }
        }
        return map;
    }

    public static WritableArray convertJsonToArray(JSONArray jsonArray) throws JSONException {
        WritableArray array = new WritableNativeArray();

        for (int i = 0; i < jsonArray.length(); i++) {
            Object value = jsonArray.get(i);
            if (value instanceof JSONObject) {
                array.pushMap(convertJsonToMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                array.pushArray(convertJsonToArray((JSONArray) value));
            } else if (value instanceof Boolean) {
                array.pushBoolean((Boolean) value);
            } else if (value instanceof Integer) {
                array.pushInt((Integer) value);
            } else if (value instanceof Double) {
                array.pushDouble((Double) value);
            } else if (value instanceof String) {
                array.pushString((String) value);
            } else {
                array.pushString(value.toString());
            }
        }
        return array;
    }

    public static HashMap<String, String> convertJSONToHashMap(JSONObject object) throws JSONException {
        if (object == null) {
            return null;
        }
        HashMap<String, String> hashMap = new HashMap<>();
        Iterator<String> iterator = object.keys();
        while (iterator.hasNext()) {
            String key = iterator.next();
            hashMap.put(key, object.optString(key));
        }
        return hashMap;
    }

    public static HashMap<String, String> convertMapToHashMap(ReadableMap map) throws JSONException {
        if (map == null) {
            return null;
        }
        HashMap<String, String> hashMap = new HashMap<>();
        ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            switch (map.getType(key)) {
                case Null:
                    break;
                case Boolean:
                    hashMap.put(key, String.valueOf(map.getBoolean(key)));
                    break;
                case Number:
                    hashMap.put(key, String.valueOf(map.getDouble(key)));
                    break;
                case String:
                    hashMap.put(key, map.getString(key));
                    break;
                case Map:
                    hashMap.put(key, convertMapToJSON(map.getMap(key)).toString());
                    break;
                case Array:
                    hashMap.put(key, convertArrayToJSON(map.getArray(key)).toString());
                    break;
            }
        }
        return hashMap;
    }

    /**
     * RN ReadableMap转JSONObject.
     *
     * @param map
     * @return
     * @throws JSONException
     */
    public static JSONObject convertMapToJSON(ReadableMap map) throws JSONException {
        if (map == null) {
            return null;
        }
        JSONObject object = new JSONObject();
        ReadableMapKeySetIterator iterator = map.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            switch (map.getType(key)) {
                case Null:
                    object.put(key, JSONObject.NULL);
                    break;
                case Boolean:
                    object.put(key, map.getBoolean(key));
                    break;
                case Number:
                    object.put(key, map.getDouble(key));
                    break;
                case String:
                    object.put(key, map.getString(key));
                    break;
                case Map:
                    object.put(key, convertMapToJSON(map.getMap(key)));
                    break;
                case Array:
                    object.put(key, convertArrayToJSON(map.getArray(key)));
                    break;
            }
        }
        return object;

    }

    /**
     * RN ReadableArray转JSONArray.
     *
     * @param array
     * @return
     * @throws JSONException
     */
    public static JSONArray convertArrayToJSON(ReadableArray array) throws JSONException {
        if (array == null) {
            return null;
        }
        JSONArray jsonArray = new JSONArray();
        for (int i = 0; i < array.size(); i++) {
            switch (array.getType(i)) {
                case Null:
                    jsonArray.put(JSONObject.NULL);
                    break;
                case Boolean:
                    jsonArray.put(array.getBoolean(i));
                    break;
                case Number:
                    jsonArray.put(array.getDouble(i));
                    break;
                case String:
                    jsonArray.put(array.getString(i));
                    break;
                case Map:
                    jsonArray.put(convertMapToJSON(array.getMap(i)));
                    break;
                case Array:
                    jsonArray.put(convertArrayToJSON(array.getArray(i)));
                    break;
            }
        }
        return jsonArray;
    }

}
