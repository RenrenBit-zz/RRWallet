package com.renrenbit.rrwallet.network

import java.util.*

internal class LimitCountCache<K, V>

(private val maxSize: Int) {
    private val map: LinkedHashMap<K, V>
    private var size: Int = 0
    private var putCount: Int = 0
    private var createCount: Int = 0
    private var evictionCount: Int = 0
    private var hitCount: Int = 0
    private var missCount: Int = 0

    init {
        if (maxSize <= 0) {
            throw IllegalArgumentException("maxSize <= 0")
        }
        this.map = LinkedHashMap(0, 0.75f, false)
    }


    @Synchronized operator fun get(key: K?): V? {
        if (key == null) {
            throw NullPointerException("key == null")
        }
        var result: V? = map[key]
        if (result != null) {
            hitCount++
            return result
        }
        missCount++
        result = create(key)
        if (result != null) {
            createCount++
            size += safeSizeOf(key, result)
            map.put(key, result)
            trimToSize(maxSize)
        }
        return result
    }

    @Synchronized
    fun put(key: K?, value: V?): V? {
        if (key == null || value == null) {
            throw NullPointerException("key == null || value == null")
        }
        putCount++
        size += safeSizeOf(key, value)
        val previous = map.put(key, value)
        if (previous != null) {
            size -= safeSizeOf(key, previous)
        }
        trimToSize(maxSize)
        return previous
    }

    private fun trimToSize(maxSize: Int) {
        while (size > maxSize && !map.isEmpty()) {
            val toEvict = map.entries.iterator().next()
            val key = toEvict.key
            val value = toEvict.value
            map.remove(key)
            size -= safeSizeOf(key, value)
            evictionCount++
            entryEvicted(key, value)
        }
        if (size < 0 || map.isEmpty() && size != 0) {
            throw IllegalStateException(javaClass.name + ".sizeOf() is reporting inconsistent results!")
        }
    }

    @Synchronized
    fun remove(key: K?): V? {
        if (key == null) {
            throw NullPointerException("key == null")
        }
        val previous = map.remove(key)
        if (previous != null) {
            size -= safeSizeOf(key, previous)
        }
        return previous
    }

    private fun entryEvicted(key: K, value: V) {}

    private fun create(key: K): V? {
        return null
    }

    private fun safeSizeOf(key: K, value: V): Int {
        val result = sizeOf(key, value)
        if (result < 0) {
            throw IllegalStateException("Negative size: $key=$value")
        }
        return result
    }


    protected fun sizeOf(key: K, value: V): Int {
        return 1
    }


    @Synchronized
    fun evictAll() {
        trimToSize(-1) // -1 will evict 0-sized elements
    }


    @Synchronized
    fun size(): Int {
        return size
    }


    @Synchronized
    fun maxSize(): Int {
        return maxSize
    }

    @Synchronized
    fun hitCount(): Int {
        return hitCount
    }

    @Synchronized
    fun missCount(): Int {
        return missCount
    }

    @Synchronized
    fun createCount(): Int {
        return createCount
    }

    @Synchronized
    fun putCount(): Int {
        return putCount
    }

    @Synchronized
    fun evictionCount(): Int {
        return evictionCount
    }

    @Synchronized
    fun snapshot(): Map<K, V> {
        return LinkedHashMap(map)
    }

    @Synchronized override fun toString(): String {
        val accesses = hitCount + missCount
        val hitPercent = if (accesses != 0) 100 * hitCount / accesses else 0
        return String.format("LruCache[maxSize=%d,hits=%d,misses=%d,hitRate=%d%%]",
                maxSize, hitCount, missCount, hitPercent)
    }
}

