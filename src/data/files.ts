export interface LabFile {
  name: string;
  kind: "folder" | "text" | "locked" | "secret" | "denied";
  body?: string;
  children?: LabFile[];
  egg?: string;
}

export const FILE_TREE: LabFile[] = [
  {
    name: "study_material",
    kind: "denied",
    body: "⛔ SERVICE DENIED: You are at college!\n\nStudying during lab practical hours is strictly prohibited by department policy.\nPlease return to playing games, chatting, or staring out the window.",
  },
  {
    name: "CPP_DSA",
    kind: "folder",
    children: [
      {
        name: "1_Easy_TwoSum.cpp",
        kind: "text",
        body: `// PROBLEM: Two Sum (Easy)
// Target sum in array using unordered_map O(n)
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        int diff = target - nums[i];
        if (mp.count(diff)) return {mp[diff], i};
        mp[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = twoSum(nums, 9);
    cout << "Indices: [" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}`,
      },
      {
        name: "2_Medium_ReverseLinkedList.cpp",
        kind: "text",
        body: `// PROBLEM: Reverse Singly Linked List (Medium)
// Iterative O(n) time, O(1) space
#include <iostream>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode *prev = nullptr, *curr = head;
    while (curr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}

int main() {
    ListNode* head = new ListNode(1);
    head->next = new ListNode(2);
    head->next->next = new ListNode(3);
    head = reverseList(head);
    cout << "Reversed Head: " << head->val << endl;
    return 0;
}`,
      },
      {
        name: "3_Hard_LRUCache.cpp",
        kind: "text",
        body: `// PROBLEM: LRU Cache Implementation (Hard)
// Doubly Linked List + Hash Map for O(1) get & put
#include <iostream>
#include <unordered_map>
using namespace std;

class LRUCache {
    struct Node {
        int key, val;
        Node *prev, *next;
        Node(int k, int v) : key(k), val(v), prev(nullptr), next(nullptr) {}
    };
    int cap;
    unordered_map<int, Node*> map;
    Node *head, *tail;

    void remove(Node* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
    }
    void insert(Node* node) {
        node->next = head->next;
        node->next->prev = node;
        head->next = node;
        node->prev = head;
    }
public:
    LRUCache(int capacity) : cap(capacity) {
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head->next = tail;
        tail->prev = head;
    }
    int get(int key) {
        if (map.count(key)) {
            Node* node = map[key];
            remove(node);
            insert(node);
            return node->val;
        }
        return -1;
    }
    void put(int key, int value) {
        if (map.count(key)) remove(map[key]);
        if (map.size() == cap) {
            map.erase(tail->prev->key);
            remove(tail->prev);
        }
        Node* newNode = new Node(key, value);
        insert(newNode);
        map[key] = newNode;
    }
};`,
      },
    ],
  },
  {
    name: "Python_DSA",
    kind: "folder",
    children: [
      {
        name: "1_Easy_ValidAnagram.py",
        kind: "text",
        body: `# PROBLEM: Valid Anagram (Easy)
# Time: O(n), Space: O(1)

def isAnagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count = {}
    for char in s:
        count[char] = count.get(char, 0) + 1
    for char in t:
        if char not in count or count[char] == 0:
            return False
        count[char] -= 1
    return True

print("Anagram Check:", isAnagram("listen", "silent")) # True`,
      },
      {
        name: "2_Medium_3Sum.py",
        kind: "text",
        body: `# PROBLEM: 3Sum (Medium)
# Find all unique triplets that sum to 0 using Two Pointers O(n^2)

def threeSum(nums):
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            total = nums[i] + nums[l] + nums[r]
            if total < 0:
                l += 1
            elif total > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1
                r -= 1
    return res

print("3Sum Result:", threeSum([-1, 0, 1, 2, -1, -4]))`,
      },
      {
        name: "3_Hard_TrappingRainWater.py",
        kind: "text",
        body: `# PROBLEM: Trapping Rain Water (Hard)
# Two-Pointer approach in O(n) time, O(1) space

def trap(height):
    if not height: return 0
    l, r = 0, len(height) - 1
    leftMax, rightMax = height[l], height[r]
    water = 0
    while l < r:
        if leftMax < rightMax:
            l += 1
            leftMax = max(leftMax, height[l])
            water += leftMax - height[l]
        else:
            r -= 1
            rightMax = max(rightMax, height[r])
            water += rightMax - height[r]
    return water

print("Trapped Water:", trap([0,1,0,2,1,0,1,3,2,1,2,1])) # 6`,
      },
    ],
  },
  {
    name: "Java_DSA",
    kind: "folder",
    children: [
      {
        name: "1_Easy_PalindromeNumber.java",
        kind: "text",
        body: `// PROBLEM: Palindrome Number (Easy)
// Check without converting to string O(log10 n)

public class Solution {
    public static boolean isPalindrome(int x) {
        if (x < 0 || (x % 10 == 0 && x != 0)) return false;
        int revertedNumber = 0;
        while (x > revertedNumber) {
            revertedNumber = revertedNumber * 10 + x % 10;
            x /= 10;
        }
        return x == revertedNumber || x == revertedNumber / 10;
    }
    public static void main(String[] args) {
        System.out.println("121 is Palindrome: " + isPalindrome(121));
    }
}`,
      },
      {
        name: "2_Medium_ContainerWithMostWater.java",
        kind: "text",
        body: `// PROBLEM: Container With Most Water (Medium)
// Two-pointer Greedy O(n)

public class Solution {
    public static int maxArea(int[] height) {
        int max = 0, l = 0, r = height.length - 1;
        while (l < r) {
            int h = Math.min(height[l], height[r]);
            max = Math.max(max, h * (r - l));
            if (height[l] < height[r]) l++;
            else r--;
        }
        return max;
    }
    public static void main(String[] args) {
        int[] h = {1, 8, 6, 2, 5, 4, 8, 3, 7};
        System.out.println("Max Area: " + maxArea(h));
    }
}`,
      },
      {
        name: "3_Hard_MedianTwoSortedArrays.java",
        kind: "text",
        body: `// PROBLEM: Median of Two Sorted Arrays (Hard)
// Binary Search on smaller array in O(log(min(m, n)))

public class Solution {
    public static double findMedianSortedArrays(int[] A, int[] B) {
        if (A.length > B.length) return findMedianSortedArrays(B, A);
        int m = A.length, n = B.length;
        int low = 0, high = m;
        while (low <= high) {
            int i = (low + high) / 2;
            int j = (m + n + 1) / 2 - i;
            int maxLeftA = (i == 0) ? Integer.MIN_VALUE : A[i - 1];
            int minRightA = (i == m) ? Integer.MAX_VALUE : A[i];
            int maxLeftB = (j == 0) ? Integer.MIN_VALUE : B[j - 1];
            int minRightB = (j == n) ? Integer.MAX_VALUE : B[j];

            if (maxLeftA <= minRightB && maxLeftB <= minRightA) {
                if ((m + n) % 2 == 0) {
                    return (Math.max(maxLeftA, maxLeftB) + Math.min(minRightA, minRightB)) / 2.0;
                } else return Math.max(maxLeftA, maxLeftB);
            } else if (maxLeftA > minRightB) high = i - 1;
            else low = i + 1;
        }
        return 0.0;
    }
}`,
      },
    ],
  },
  {
    name: "JavaScript_DSA",
    kind: "folder",
    children: [
      {
        name: "1_Easy_KadaneMaxSubarray.js",
        kind: "text",
        body: `// PROBLEM: Maximum Subarray (Kadane's Algorithm) (Easy)
// Dynamic Programming / Greedy O(n)

function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currMax = nums[0];

  for (let i = 1; i < nums.length; i++) {
    currMax = Math.max(nums[i], currMax + nums[i]);
    maxSoFar = Math.max(maxSoFar, currMax);
  }
  return maxSoFar;
}

console.log("Max Subarray Sum:", maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4])); // 6`,
      },
      {
        name: "2_Medium_CoinChange.js",
        kind: "text",
        body: `// PROBLEM: Coin Change (Medium)
// DP Bottom-Up O(amount * coins.length)

function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}

console.log("Min Coins for 11:", coinChange([1, 2, 5], 11)); // 3`,
      },
      {
        name: "3_Hard_SlidingWindowMax.js",
        kind: "text",
        body: `// PROBLEM: Sliding Window Maximum (Hard)
// Monotonic Deque approach in O(n) time

function maxSlidingWindow(nums, k) {
  const deque = []; // stores indices
  const res = [];

  for (let i = 0; i < nums.length; i++) {
    // Remove indices out of current window
    if (deque.length && deque[0] <= i - k) deque.shift();

    // Remove elements smaller than current element
    while (deque.length && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }

    deque.push(i);
    if (i >= k - 1) res.push(nums[deque[0]]);
  }
  return res;
}

console.log("Window Max:", maxSlidingWindow([1,3,-1,-3,5,3,6,7], 3));`,
      },
    ],
  },
  {
    name: "DO_NOT_OPEN",
    kind: "folder",
    children: [{ name: "told_you.txt", kind: "secret", body: "", egg: "file_do_not_open" }],
  },
];
