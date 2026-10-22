// The model voice's pitch for each shadowing step, ten readings a second in whole hertz (null where unvoiced), read from its saved recording with the app's own pitch reader (decision 111). Written by `pnpm shadow-pitch`; do not edit by hand

// Each step's readings, by its recording's id
export const SHADOW_PITCH: Readonly<Record<string, ReadonlyArray<number | null>>> = {
  // s01-1
  "s01-1": [95, 90, null, null, 111, 81, null, null, null, null, null, null, 81, null, null, null, 80, 83, 84, 78, 76, 78, 217, 84, 78],
  // s01-2
  "s01-2": [180, null, 122, 112, null, null, null, 107, 200, 100, null, 138, 146, 141, 140, null, 98, 104, 100, null, 86, 95, 133],
  // s01-3
  "s01-3": [183, null, 158, 155, 103, 94, 118, 118, null, 85, null, 85, null, 82, 84],
  // s01-all
  "s01-all": [96, 97, 87, null, 104, 100, 71, null, null, null, null, null, 78, null, null, 79, 83, 80, 78, 79, 80, 87, 85, 83, null, null, null, null, null, null, null, null, 124, 148, null, null, 109, 111, null, null, 230, null, null, null, null, 98, null, 131, 135, 134, 133, null, 102, 102, 102, null, 91, 88, 95, 76, null, null, null, null, null, null, null, 116, 114, null, 99, 98, 98, 120, 111, 81, null, 84, null, 85, null, 81, 85, null, null, 74],
  // s02-1
  "s02-1": [105, 106, 98, 98, 132, 145, 146, null, null, 110, 110, 95, 88, 78, null, 78, null, null, null, null, null, null, null, 93, null, null, 136, 85, null, 74, null, 98, null, 96, null, null, 79],
  // s02-2
  "s02-2": [116, 117, null, null, 157, 174, 176, null, 121, 111, 96, 98, null, null, null, null, null, null, 75, 105, 116, 105, 128, 128, null, null, null, null, null, null, 144, 123, 74],
  // s02-3
  "s02-3": [101, 105, 177, 175, null, null, 119, 118, 125, 103, 95, 90, 90, null, null, null, null, 116, 126, 124, null, null, null, null, null, 116, 87, 84, 81, 94, 107, 109, null, null, null, 89, 86, null, 82, 84, null, 80],
  // s02-all
  "s02-all": [110, 100, 105, 132, 148, 149, null, null, 109, 101, 91, 88, null, null, null, null, null, null, null, null, null, 94, null, null, 131, 126, null, 73, 80, null, 92, 489, 89, null, null, null, null, null, null, null, null, null, null, null, 133, 152, 164, 166, null, 134, 131, 114, 93, 78, 84, null, 91, 78, 103, 119, 107, null, 120, 103, 111, null, null, null, null, 139, 120, null, null, null, null, null, null, null, null, null, null, 160, 168, null, null, 121, 118, 125, 100, 97, 99, 96, null, null, 110, 113, 111, null, null, null, null, null, null, 86, 78, 74, 96, 104, null, null, null, 81, 80, 81, 76, 74, 74],
  // s03-1
  "s03-1": [188, null, null, 77, 73, 87, null, null, null, 109, null, 198, 191, 158, null, 114, 121, 102, 96, null, null, null, 108, 105, null, 80],
  // s03-2
  "s03-2": [95, 91, 92, null, 96, null, null, 110, 120, 127, 131, 125, null, 108, 98, 92, 88, 91, 88, null, 90, null, null, null, null, null, 82],
  // s03-3
  "s03-3": [],
  // s03-all
  "s03-all": [156, null, null, null, 71, 95, 96, null, null, null, null, null, 189, 193, 180, null, 119, null, 104, 96, null, null, 134, 144, 136, 112, 76, null, null, null, null, null, null, null, null, 91, 91, null, 112, 131, 139, 143, null, 115, 110, 106, 105, 102, 98, 98, null, null, null, 107, 90, 76, 77, null, null, null, null, null, null, null, null, null, null, 103, 93],
  // s04-1
  "s04-1": [288, 295, null, 239, 198, 316, 344, 287, 219, 143, 118],
  // s04-2
  "s04-2": [146, 284, null, 262, null, null, null, 259, 271, 265, 279, 254, null, 286, 287, 210, null, null, 255, 272, null, 288, 311, 320, 114, 106],
  // s04-3
  "s04-3": [93, 74, 72, null, null, null, null, 228, 270],
  // s04-4
  "s04-4": [158, null, 159, 146, 124, 113, 135, 431],
  // s04-all
  "s04-all": [291, null, 298, 215, null, 313, 297, 264, 117, 82, null, null, null, null, 247, 241, null, 191, null, null, 243, 272, 288, 214, 249, 240, 213, 202, null, 207, null, null, 217, 236, 242, 227, null, 242, 263, null, 86, null, null, null, null, 104, 104, 77, null, null, 201, 303, null, null, null, null, null, null, null, null, null, 207, 109, 97, 102, 268, 232],
  // s05-1
  "s05-1": [188, 185, 137, 126, null, null, 104, 121, 128, null, 114, null, null, null, null, 175, null, 125, 139, 161, 129, 130, 205],
  // s05-2
  "s05-2": [119, 144, 186, 201, null, 121, 116, 113, 107, null, null, null, 165, null, 134, 116, 96, 92, 101, 101, null, 77, null, null, null, null, null, 78, 84, 119, 120, 123, 126, null, 100, 104, null, null, null, 113],
  // s05-3
  "s05-3": [113, 133, 128, 144, 151, 97, 91, null, null, null, null, null, null, null, null, 95, 104, 108, null, null, 110, null, 311],
  // s05-4
  "s05-4": [219, 208, 252, 304, null, 98, null, null, null, 107, 421, 250, 245, 213, 238, 303, null, 84, 83],
  // s05-all
  "s05-all": [193, 187, 177, 166, null, 119, 119, 126, null, 106, null, null, null, 128, null, null, 108, 95, null, 79, null, null, null, null, null, null, null, 109, 113, 159, null, 155, 171, 185, 135, null, null, null, 147, null, 106, 90, 87, 149, 158, null, null, null, 74, null, null, null, 76, 74, 121, 126, 134, 131, 109, 110, 90, null, null, null, null, null, null, null, null, null, null, 82, 101, null, 166, 183, null, null, null, null, null, null, null, 108, 112, null, null, 105, null, null, null, null, null, null, null, 204, null, 253, 258, 107, null, null, null, null, null, 258, null, null, null, 92],
  // s06-1
  "s06-1": [113, null, 209, 208, 165, null, null, 126, 99, 96, 78, null, 91, 90, 95, 88],
  // s06-2
  "s06-2": [101, 87, 93, 91, 96, 107, 137, null, null, 89, null, null, null, 92],
  // s06-3
  "s06-3": [90, 112, 108, 87, 126, 126, 81, null, 88, 91, null, 85],
  // s06-4
  "s06-4": [95, 111, 122, 104, 131, 140, 130, 111, 112, 86, 82, null, null, null, null, null, null, null, null, null, 79, 78],
  // s06-all
  "s06-all": [105, 196, 201, 201, 168, null, null, 126, 101, 94, 87, 88, 93, 92, null, null, null, null, null, null, null, null, null, 112, 102, 98, 96, 105, 114, null, null, 79, null, null, null, 89, null, 93, 92, null, null, null, null, null, null, 94, 99, 86, 87, 115, 88, null, null, 89, 81, null, null, null, null, null, null, null, 94, 95, 87, 81, 119, 151, 152, 167, 120, 122, 98, null, null, null, null, null, 89, 76],
};
