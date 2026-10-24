"""اختبارات واجهة المحرر البصري (‎/api/v1/editor/‎).

كل مسار: نجاح، تحقق، غير داخل (401)، داخل وليس من فريق العمل (403)، وCSRF.
"""

import json

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import Client, TestCase
from django.utils import timezone

from system import blocks as B
from system.data import golden_classic
from system.models import Customer, Invitation, Plan, Template

BASE = "/api/v1/editor"


def _endpoints(inv, tpl):
    return [
        ("GET", f"{BASE}/schema/"),
        ("GET", f"{BASE}/invitations/{inv}/"),
        ("POST", f"{BASE}/invitations/{inv}/preview/"),
        ("POST", f"{BASE}/invitations/{inv}/save/"),
        ("GET", f"{BASE}/templates/{tpl}/"),
        ("POST", f"{BASE}/templates/{tpl}/preview/"),
        ("POST", f"{BASE}/templates/{tpl}/save/"),
    ]


class EditorApiCase(TestCase):
    def setUp(self):
        cache.clear()
        self.staff = User.objects.create_user("owner", password="x" * 12, is_staff=True)
        self.plain = User.objects.create_user("visitor", password="x" * 12)
        self.client = Client(enforce_csrf_checks=True)
        self.client.force_login(self.staff)

        self.customer = Customer.objects.create(name="عميل", phone="0100")
        # باقة فيها RSVP بس: أقسام العد التنازلي والمعرض… خارج الباقة
        self.plan = Plan.objects.create(name="أساسية", slug="basic", price=100,
                                        features=["rsvp"])
        self.template = Template.objects.create(
            name="ذهبي", slug="golden-t", document=golden_classic.build())
        self.inv = Invitation.objects.create(
            customer=self.customer, template=self.template, plan=self.plan,
            name_one="ليلى", name_two="أحمد", status="published", venue="القاعة")

    def csrf(self):
        return {"HTTP_X_CSRFTOKEN": self.client.get("/api/v1/csrf/").json()["csrfToken"]}

    def post(self, path, data):
        return self.client.post(path, data=json.dumps(data),
                                content_type="application/json", **self.csrf())

    def assertError(self, response, status, code):
        self.assertEqual(response.status_code, status, response.content[:300])
        self.assertEqual(response.json()["error"]["code"], code)


# ---------------------------------------------------------------- الحماية
class GuardTests(EditorApiCase):
    def test_anonymous_gets_401(self):
        self.client.logout()
        for method, path in _endpoints(self.inv.pk, self.template.pk):
            with self.subTest(path=path):
                response = (self.client.get(path) if method == "GET"
                            else self.post(path, {}))
                self.assertEqual(response.status_code, 401, response.content[:200])

    def test_non_staff_gets_403(self):
        self.client.force_login(self.plain)
        for method, path in _endpoints(self.inv.pk, self.template.pk):
            with self.subTest(path=path):
                response = (self.client.get(path) if method == "GET"
                            else self.post(path, {}))
                self.assertEqual(response.status_code, 403, response.content[:200])

    def test_post_without_csrf_is_rejected(self):
        for method, path in _endpoints(self.inv.pk, self.template.pk):
            if method != "POST":
                continue
            with self.subTest(path=path):
                response = self.client.post(path, data="{}", content_type="application/json")
                self.assertEqual(response.status_code, 403)

    def test_unknown_ids_are_404(self):
        self.assertError(self.client.get(f"{BASE}/invitations/999999/"), 404, "not_found")
        self.assertError(self.client.get(f"{BASE}/templates/999999/"), 404, "not_found")


# ---------------------------------------------------------------- السكيما
class SchemaTests(EditorApiCase):
    def test_schema_matches_engine_and_caches_by_etag(self):
        response = self.client.get(f"{BASE}/schema/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(set(data["blocks"]), set(B.BLOCK_REGISTRY))
        self.assertTrue(data["theme_fields"] and data["settings_fields"])
        self.assertIn("private", response["Cache-Control"])
        etag = response["ETag"]
        again = self.client.get(f"{BASE}/schema/", HTTP_IF_NONE_MATCH=etag)
        self.assertEqual(again.status_code, 304)


# ---------------------------------------------------------------- فتح المحرر
class BootstrapTests(EditorApiCase):
    def test_invitation_bootstrap(self):
        data = self.client.get(f"{BASE}/invitations/{self.inv.pk}/").json()
        self.assertEqual(data["mode"], "invitation")
        self.assertEqual(data["id"], self.inv.pk)
        self.assertEqual(data["features"], sorted(self.inv.allowed_features))
        self.assertEqual(data["fields"]["nameOne"], "ليلى")
        self.assertEqual(data["fields"]["venue"], "القاعة")
        self.assertEqual(data["fields"]["slug"], self.inv.slug)
        self.assertEqual(data["meta"]["slug"], self.inv.slug)
        self.assertIn(self.inv.slug, data["meta"]["publicUrl"])
        self.assertEqual(data["meta"]["planName"], "أساسية")
        for key in ("assets", "fonts", "intros", "music", "categories"):
            self.assertIsInstance(data[key], list, key)

    def test_empty_invitation_document_falls_back_to_template(self):
        self.assertFalse(self.inv.get_document()["blocks"])
        data = self.client.get(f"{BASE}/invitations/{self.inv.pk}/").json()
        self.assertEqual(
            [b["type"] for b in data["document"]["blocks"]],
            [b["type"] for b in self.template.get_document()["blocks"]])

    def test_event_date_uses_datetime_local_format(self):
        self.inv.event_date = timezone.now().replace(microsecond=0)
        self.inv.save()
        value = self.client.get(f"{BASE}/invitations/{self.inv.pk}/").json()["fields"]["eventDate"]
        self.assertRegex(value, r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$")

    def test_template_bootstrap(self):
        data = self.client.get(f"{BASE}/templates/{self.template.pk}/").json()
        self.assertEqual(data["mode"], "template")
        self.assertIsNone(data["fields"])
        self.assertEqual(data["features"], sorted(B.feature_keys()))
        self.assertTrue(data["document"]["blocks"])
        self.assertIn(self.template.slug, data["meta"]["publicUrl"])


# ---------------------------------------------------------------- المعاينة
class PreviewTests(EditorApiCase):
    def doc(self, *blocks):
        document = B.empty_document()
        document["blocks"] = list(blocks)
        return document

    def preview(self, document, **extra):
        return self.post(f"{BASE}/invitations/{self.inv.pk}/preview/",
                         {"document": document, **extra})

    def test_hidden_blocks_stay_for_the_editor_and_are_marked(self):
        shown = B.make_block("text")
        hidden = B.make_block("quote", visible=False)
        data = self.preview(self.doc(shown, hidden)).json()
        by_id = {b["id"]: b for b in data["blocks"]}
        self.assertEqual(set(by_id), {shown["id"], hidden["id"]})
        self.assertIs(by_id[hidden["id"]]["hidden"], True)
        self.assertIn("lb--hidden", by_id[hidden["id"]]["attrs"]["className"])
        self.assertIs(by_id[shown["id"]]["hidden"], False)
        self.assertNotIn("lb--hidden", by_id[shown["id"]]["attrs"]["className"])
        self.assertIs(data["editable"], True)
        self.assertEqual(data["kind"], "invitation")

    def test_guest_render_still_skips_hidden_blocks(self):
        from system.api import invite_render
        hidden = B.make_block("quote", visible=False)
        payload, _ = invite_render.build_payload(self.doc(B.make_block("text"), hidden))
        self.assertEqual([b["type"] for b in payload["blocks"]], ["text"])
        self.assertNotIn("hidden", payload["blocks"][0])
        self.assertNotIn("gated", payload["blocks"][0])

    def test_blocks_outside_the_plan_are_flagged(self):
        data = self.preview(self.doc(B.make_block("countdown"), B.make_block("text"))).json()
        flags = {b["type"]: b["gated"] for b in data["blocks"]}
        self.assertEqual(flags, {"countdown": True, "text": False})

    def test_unsaved_draft_is_what_gets_rendered(self):
        block = B.make_block("text", props={"heading": "عنوان مسودة"})
        data = self.preview(self.doc(block)).json()
        self.assertEqual(data["blocks"][0]["props"]["heading"], "عنوان مسودة")
        self.assertFalse(self.inv.get_document()["blocks"])     # مفيش حاجة اتحفظت

    def test_rsvp_is_a_demo_inside_the_editor(self):
        data = self.preview(self.doc(B.make_block("rsvp"))).json()
        rsvp = data["blocks"][0]["rsvp"]
        self.assertTrue(rsvp["demo"])
        self.assertEqual(rsvp["action"], "")

    def test_missing_translation_falls_back_to_the_base_language(self):
        data = self.preview(self.doc(B.make_block("text")), lang="en").json()
        self.assertEqual(data["lang"], data["baseLang"])

    def test_css_strings_are_always_included(self):
        data = self.preview(self.doc(B.make_block("text"))).json()
        self.assertEqual(set(data["css"]), {"font", "layout", "shared", "zero"})
        self.assertIn("--", data["bodyStyle"])

    def test_document_is_required(self):
        path = f"{BASE}/invitations/{self.inv.pk}/preview/"
        self.assertError(self.post(path, {}), 400, "invalid_document")
        self.assertError(self.post(path, {"document": [1]}), 400, "invalid_document")

    def test_template_preview_never_flags_features(self):
        path = f"{BASE}/templates/{self.template.pk}/preview/"
        data = self.post(path, {"document": self.doc(B.make_block("countdown"))}).json()
        self.assertEqual(data["kind"], "template")
        self.assertIs(data["blocks"][0]["gated"], False)


# ---------------------------------------------------------------- الحفظ
class SaveTests(EditorApiCase):
    def path(self):
        return f"{BASE}/invitations/{self.inv.pk}/save/"

    def test_saves_document_and_fields(self):
        block = B.make_block("text", props={"heading": "محفوظ"})
        document = B.empty_document()
        document["blocks"] = [block]
        response = self.post(self.path(), {
            "document": document,
            "fields": {"nameOne": "سارة", "venue": "الفندق", "eventDate": "2030-05-01T20:30"},
        })
        self.assertEqual(response.status_code, 200, response.content[:300])
        body = response.json()
        self.assertEqual(body["slug"], self.inv.slug)
        self.assertRegex(body["savedAt"], r"^\d{2}:\d{2}:\d{2}$")
        self.inv.refresh_from_db()
        self.assertEqual(self.inv.name_one, "سارة")
        self.assertEqual(self.inv.venue, "الفندق")
        self.assertEqual(timezone.localtime(self.inv.event_date).strftime("%Y-%m-%d %H:%M"),
                         "2030-05-01 20:30")
        saved = self.inv.get_document()
        self.assertEqual([b["id"] for b in saved["blocks"]], [block["id"]])
        self.assertEqual(saved["blocks"][0]["props"]["heading"], "محفوظ")

    def test_document_only_save_keeps_event_data(self):
        document = B.empty_document()
        document["blocks"] = [B.make_block("text")]
        self.assertEqual(self.post(self.path(), {"document": document}).status_code, 200)
        self.inv.refresh_from_db()
        self.assertEqual(self.inv.name_one, "ليلى")
        self.assertEqual(self.inv.venue, "القاعة")
        self.assertEqual(self.inv.status, "published")

    def test_document_is_normalized_before_saving(self):
        document = B.empty_document()
        document["blocks"] = [B.make_block("text"), {"id": "x1", "type": "no-such-type", "props": {}}]
        self.post(self.path(), {"document": document})
        self.inv.refresh_from_db()
        self.assertEqual([b["type"] for b in self.inv.get_document()["blocks"]], ["text"])

    def test_slug_change_is_returned(self):
        document = B.empty_document()
        response = self.post(self.path(), {"document": document, "fields": {"slug": "My New Slug"}})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["slug"], "my-new-slug")
        self.assertIn("my-new-slug", response.json()["publicUrl"])

    def test_invalid_slug_is_a_validation_error(self):
        document = B.empty_document()
        other = Invitation.objects.create(customer=self.customer, template=self.template,
                                          slug="taken-slug")
        for value in ("ab", "rsvp", other.slug):
            with self.subTest(slug=value):
                response = self.post(self.path(), {"document": document, "fields": {"slug": value}})
                self.assertError(response, 400, "validation_error")
                self.assertIn("slug", response.json()["error"]["fields"])
        self.inv.refresh_from_db()
        self.assertNotEqual(self.inv.slug, "taken-slug")

    def test_document_is_required(self):
        self.assertError(self.post(self.path(), {"fields": {"nameOne": "x"}}), 400, "invalid_document")
        self.assertError(self.post(self.path(), {"document": "nope"}), 400, "invalid_document")
        self.inv.refresh_from_db()
        self.assertEqual(self.inv.name_one, "ليلى")

    def test_invalid_json_is_400(self):
        response = self.client.post(self.path(), data="{oops", content_type="application/json",
                                    **self.csrf())
        self.assertError(response, 400, "invalid_json")

    def test_template_save(self):
        block = B.make_block("text", props={"heading": "قالب"})
        document = B.empty_document()
        document["blocks"] = [block]
        response = self.post(f"{BASE}/templates/{self.template.pk}/save/", {"document": document})
        self.assertEqual(response.status_code, 200, response.content[:300])
        self.assertIn(self.template.slug, response.json()["publicUrl"])
        self.template.refresh_from_db()
        self.assertEqual([b["id"] for b in self.template.get_document()["blocks"]], [block["id"]])
        self.assertEqual(self.template.preview_render, {})
