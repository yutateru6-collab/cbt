import importlib.util
import struct
import unittest
from pathlib import Path
from types import SimpleNamespace


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "normalize-grade2-listening-pauses.py"
SPEC = importlib.util.spec_from_file_location("normalizer", SCRIPT)
normalizer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(normalizer)


class PauseNormalizerTests(unittest.TestCase):
    def test_only_declared_silence_ranges_are_replaced(self):
        params = SimpleNamespace(framerate=1000, sampwidth=2, nchannels=1, nframes=1100)
        samples = [1000] * 200 + [0] * 100 + [1200] * 200 + [0] * 100 + [1400] * 500
        frames = struct.pack(f"<{len(samples)}h", *samples)
        output, boundaries = normalizer.replace_gaps(params, frames, [[200, 300], [500, 600]])
        values = struct.unpack(f"<{len(output) // 2}h", output)

        self.assertEqual(boundaries, [[200, 1000], [1200, 1800]])
        self.assertEqual(values[:200], tuple([1000] * 200))
        self.assertEqual(values[200:1000], tuple([0] * 800))
        self.assertEqual(values[1000:1200], tuple([1200] * 200))
        self.assertEqual(values[1200:1800], tuple([0] * 600))
        self.assertEqual(values[1800:], tuple([1400] * 500))

    def test_ambiguous_auto_detection_stops_processing(self):
        params = SimpleNamespace(framerate=1000, sampwidth=2, nchannels=1, nframes=1200)
        samples = [1000] * 600 + [0] * 200 + [1000] * 100 + [0] * 200 + [1000] * 100
        frames = struct.pack(f"<{len(samples)}h", *samples)
        boundaries, method, candidates = normalizer.choose_boundaries(params, frames, None)
        self.assertIsNotNone(boundaries)
        self.assertEqual(method, "automatic")
        self.assertEqual(len(candidates), 2)

        samples = [1000] * 800 + [0] * 160 + [1000] * 80 + [0] * 160 + [1000] * 80 + [0] * 160 + [1000] * 160
        params.nframes = len(samples)
        frames = struct.pack(f"<{len(samples)}h", *samples)
        boundaries, method, candidates = normalizer.choose_boundaries(params, frames, None)
        self.assertIsNone(boundaries)
        self.assertEqual(method, "ambiguous-auto")
        self.assertEqual(len(candidates), 3)


if __name__ == "__main__":
    unittest.main()
