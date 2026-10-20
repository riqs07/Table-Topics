# Redraws Atkinson Hyperlegible Next's zero without its slash (decision 89): the two counters either side of the slash become one oval counter
# Run once with fontTools installed: python3 scripts/fonts/open-zero.py <Google's Latin woff2> src/theme/fonts/AtkinsonHyperlegibleNext-OpenZero.woff2
# The served font has no OpenType switch for the zero (its features are ccmp, frac, locl, pnum and tnum), so the glyph itself is changed

# Load the command-line arguments
import sys
# Load the font reader and writer
from fontTools.ttLib import TTFont
# Load the glyph coordinate list type
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
# Load the empty hinting program
from fontTools.ttLib.tables import ttProgram

# The file to read and the file to write
source, target = sys.argv[1], sys.argv[2]
# Read every table at once, so the variations are read against the original outline
font = TTFont(source, lazy=False)
# The outlines
glyf = font["glyf"]
# The weight variations
gvar = font["gvar"]
# The zero
zero = glyf["zero"]
# Its points, where each contour ends, and which points are on the curve
coords, ends, flags = list(zero.getCoordinates(glyf)[0]), list(zero.endPtsOfContours), bytearray(zero.flags)
# Stop if the font is not the one this was written for: an outer oval and two counters split by the slash
assert ends == [15, 26, 38], ends
# The four phantom points that follow the outline in the variations
phantom = glyf._getPhantomPoints("zero", font["hmtx"].metrics, None)
# The original outline with them, for filling in deltas left to be inferred
original = GlyphCoordinates(coords + phantom)
# Where each contour ends, phantom points included
all_ends = ends + [len(coords) + index for index in range(4)]
# The new counter in drawing order: the lower counter's bottom, a new curve point where the slash met it, the upper counter round the right and top, another new curve point, then the lower counter's left side
order = [16, 17, 18, 19, ("between", 19, 28, (462, 140)), 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 27, ("between", 27, 20, (192, 540)), 20, 21, 22, 23, 24, 25, 26]
# The outer oval stays as it is
new_coords = coords[:16]
# And its curve flags
new_flags = bytearray(flags[:16])
# Add each point of the new counter
for item in order:
    # A new curve point between the two counters
    if isinstance(item, tuple):
        # Its place (where the tangents of the two curves meet)
        new_coords.append(item[3])
        # Off the curve
        new_flags.append(0)
    # An existing point
    else:
        # Its place
        new_coords.append(coords[item])
        # Whether it is on the curve
        new_flags.append(flags[item] & 1)
# Store the new outline
zero.coordinates = GlyphCoordinates(new_coords)
# Its flags
zero.flags = new_flags
# Two contours now: the oval and one counter
zero.endPtsOfContours = [15, 15 + len(order)]
# Count them
zero.numberOfContours = 2
# Drop any hinting for the old outline
zero.program = ttProgram.Program()
# With no instructions
zero.program.fromBytecode(b"")
# Reorder each weight's deltas the same way
for variation in gvar.variations["zero"]:
    # Fill in deltas that were left to be inferred
    variation.calcInferredDeltas(original, all_ends)
    # The full list
    deltas = variation.coordinates
    # The outer oval's deltas stay
    reordered = deltas[:16]
    # Each point of the new counter
    for item in order:
        # A new point moves halfway between its two neighbours
        if isinstance(item, tuple):
            # The two neighbours
            first, second = deltas[item[1]], deltas[item[2]]
            # Their average
            reordered.append(((first[0] + second[0]) / 2, (first[1] + second[1]) / 2))
        # An existing point keeps its delta
        else:
            # Its delta
            reordered.append(deltas[item])
    # Then the phantom points
    reordered += deltas[39:43]
    # Store them as whole numbers
    variation.coordinates = [(round(point[0]), round(point[1])) for point in reordered]
# Say what changed, in the version string
for record in font["name"].names:
    # The version
    if record.nameID == 5:
        # Note the change
        record.string = record.toUnicode() + "; zero drawn without its slash for VoiceLab"
# Write it as a web font
font.flavor = "woff2"
# Save
font.save(target)
