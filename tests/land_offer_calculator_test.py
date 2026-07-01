#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SCRIPT = REPO / "scripts" / "land_offer_calculator.py"
PARCELS = REPO / "tests" / "fixtures" / "land-offer-parcels.json"
PARCELS_CSV = REPO / "tests" / "fixtures" / "land-offer-parcels.csv"
BUY_BOXES = REPO / "tests" / "fixtures" / "land-offer-buy-box-reference.json"


class LandOfferCalculatorTest(unittest.TestCase):
    def run_calculator(self, parcels: Path = PARCELS) -> dict:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "offer-packets.json"
            subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--parcels",
                    str(parcels),
                    "--buy-box-reference",
                    str(BUY_BOXES),
                    "--output",
                    str(output),
                ],
                cwd=REPO,
                check=True,
            )
            return json.loads(output.read_text())

    def packet_by_id(self, payload: dict, parcel_id: str) -> dict:
        return next(row for row in payload["offerPackets"] if row["parcelId"] == parcel_id)

    def test_rankin_reference_math_matches_operator_sheet(self) -> None:
        payload = self.run_calculator()
        packet = self.packet_by_id(payload, "rankin-123")
        self.assertEqual(packet["numbers"]["builderTarget"], 550000)
        self.assertEqual(packet["numbers"]["riskAdjustedBuilderTarget"], 550000)
        self.assertEqual(packet["numbers"]["suggestedSellerOffer"], 467500)
        self.assertEqual(packet["numbers"]["assignmentPrice"], 550000)
        self.assertEqual(packet["numbers"]["projectedAssignmentFee"], 82500)
        self.assertEqual(packet["numbers"]["smsPrice"], 468000)
        self.assertEqual(packet["confidence"], "medium")
        self.assertEqual(packet["blockers"], [])
        self.assertTrue(packet["sms"]["manualCopyOnly"])
        self.assertIn("No texting", packet["sms"]["compliance"])

    def test_mordecai_and_apex_scale_by_reference_acres(self) -> None:
        payload = self.run_calculator()
        mordecai = self.packet_by_id(payload, "mordecai-456")
        apex = self.packet_by_id(payload, "apex-321")
        self.assertEqual(mordecai["numbers"]["builderTarget"], 340000)
        self.assertEqual(mordecai["numbers"]["suggestedSellerOffer"], 289000)
        self.assertEqual(mordecai["numbers"]["projectedAssignmentFee"], 51000)
        self.assertEqual(mordecai["numbers"]["smsPrice"], 289000)
        self.assertEqual(apex["numbers"]["builderTarget"], 288000)
        self.assertEqual(apex["numbers"]["suggestedSellerOffer"], 244800)
        self.assertEqual(apex["numbers"]["projectedAssignmentFee"], 43200)
        self.assertEqual(apex["numbers"]["smsPrice"], 245000)

    def test_risk_adjustments_are_cumulative_and_explicit(self) -> None:
        payload = self.run_calculator()
        packet = self.packet_by_id(payload, "risk-001")
        self.assertEqual([row["key"] for row in packet["adjustments"]], ["flood-zone", "steep-slope", "busy-street", "no-park-nearby"])
        self.assertEqual(packet["numbers"]["totalAdjustmentPercent"], 0.36)
        self.assertEqual(packet["numbers"]["riskAdjustedBuilderTarget"], 352000)
        self.assertEqual(packet["numbers"]["suggestedSellerOffer"], 299200)
        self.assertEqual(packet["numbers"]["projectedAssignmentFee"], 52800)
        self.assertEqual(packet["numbers"]["smsPrice"], 299000)

    def test_missing_buy_box_and_access_blocker_force_manual_review(self) -> None:
        payload = self.run_calculator()
        packet = self.packet_by_id(payload, "blocked-001")
        self.assertEqual(packet["confidence"], "manual-review")
        self.assertEqual(packet["nextAction"], "manual-review")
        self.assertIn("No matching ZIP buy box or builder target.", packet["blockers"])
        self.assertIn("Acreage missing, so ZIP math cannot scale.", packet["blockers"])
        self.assertIn("Access blocker requires manual review.", packet["blockers"])
        self.assertIsNone(packet["numbers"]["smsPrice"])

    def test_manual_target_can_run_without_zip_or_acres_but_stays_manual_copy_only(self) -> None:
        payload = self.run_calculator()
        packet = self.packet_by_id(payload, "manual-001")
        self.assertEqual(packet["confidence"], "medium-high")
        self.assertEqual(packet["numbers"]["builderTarget"], 300000)
        self.assertEqual(packet["numbers"]["suggestedSellerOffer"], 255000)
        self.assertEqual(packet["numbers"]["projectedAssignmentFee"], 45000)
        self.assertEqual(packet["numbers"]["smsPrice"], 255000)
        self.assertTrue(packet["zeroFabrication"])

    def test_csv_input_is_supported(self) -> None:
        payload = self.run_calculator(PARCELS_CSV)
        self.assertEqual(payload["inputs"]["parcelCount"], 2)
        packet = self.packet_by_id(payload, "rankin-csv")
        self.assertEqual(packet["numbers"]["smsPrice"], 468000)


if __name__ == "__main__":
    unittest.main()
