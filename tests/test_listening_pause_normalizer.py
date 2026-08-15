import importlib.util
import struct
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


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

    def test_auto_detection_finds_question_gaps_among_internal_and_trailing_silence(self):
        params = SimpleNamespace(framerate=1000, sampwidth=2, nchannels=1, nframes=8000)
        candidates = [[1000, 1500], [3000, 3800], [4300, 5000], [7000, 7300]]

        with patch.object(normalizer, "find_silence_runs", return_value=candidates):
            boundaries, method, actual_candidates = normalizer.choose_boundaries(params, b"", None)

        self.assertEqual(boundaries, [[3000, 3800], [4300, 5000]])
        self.assertEqual(method, "automatic-question-structure")
        self.assertEqual(actual_candidates, candidates)

    def test_auto_detection_stops_when_multiple_question_structures_match(self):
        params = SimpleNamespace(framerate=1000, sampwidth=2, nchannels=1, nframes=9000)
        candidates = [[2000, 2600], [3100, 3700], [4300, 5000], [5600, 6200]]

        with patch.object(normalizer, "find_silence_runs", return_value=candidates):
            boundaries, method, actual_candidates = normalizer.choose_boundaries(params, b"", None)

        self.assertIsNone(boundaries)
        self.assertEqual(method, "ambiguous-question-structure")
        self.assertEqual(actual_candidates, candidates)


if __name__ == "__main__":
    unittest.main()
