import os
import re
import json
from html.parser import HTMLParser
from html.entities import name2codepoint

backup_dir = r"c:\Users\rocks\OneDrive\Desktop\SFI\backup_original_code"

# HTML parser to extract clean textual content, headings, description, and title
class HTMLSearchIndexer(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_content = []
        self.headings = []
        self.title = ""
        self.description = ""
        self.in_script_or_style = False
        self.in_header_nav_footer = False
        self.in_title = False
        self.in_heading = False
        self.current_heading = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag in ["script", "style"]:
            self.in_script_or_style = True
        elif tag in ["header", "nav", "footer", "noscript"]:
            self.in_header_nav_footer = True
        elif tag == "title":
            self.in_title = True
        elif tag in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            self.in_heading = True
            self.current_heading = []
        elif tag == "meta":
            if attrs_dict.get("name") == "description":
                self.description = attrs_dict.get("content", "")

    def handle_endtag(self, tag):
        if tag in ["script", "style"]:
            self.in_script_or_style = False
        elif tag in ["header", "nav", "footer", "noscript"]:
            self.in_header_nav_footer = False
        elif tag == "title":
            self.in_title = False
        elif tag in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            self.in_heading = False
            heading_text = "".join(self.current_heading).strip()
            if heading_text:
                self.headings.append(heading_text)

    def handle_data(self, data):
        if self.in_script_or_style or self.in_header_nav_footer:
            return
        if self.in_title:
            self.title += data
            return
        if self.in_heading:
            self.current_heading.append(data)
            
        text = data.strip()
        if text:
            # Clean up spacing
            text_cleaned = re.sub(r'\s+', ' ', text)
            self.text_content.append(text_cleaned)

    def handle_entityref(self, name):
        if self.in_script_or_style or self.in_header_nav_footer:
            return
        try:
            char = chr(name2codepoint[name])
        except KeyError:
            char = f"&{name};"
        if self.in_title:
            self.title += char
        elif self.in_heading:
            self.current_heading.append(char)
        else:
            self.text_content.append(char)

    def handle_charref(self, name):
        if self.in_script_or_style or self.in_header_nav_footer:
            return
        try:
            if name.startswith('x'):
                char = chr(int(name[1:], 16))
            else:
                char = chr(int(name))
        except ValueError:
            char = f"&#{name};"
        if self.in_title:
            self.title += char
        elif self.in_heading:
            self.current_heading.append(char)
        else:
            self.text_content.append(char)

def parse_js_data(filepath, var_name):
    """Parses standard JS objects like const martyrsData = [...] into a python list."""
    if not os.path.exists(filepath):
        print(f"Warning: File not found: {filepath}")
        return []
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read().strip()
    
    # Locate array assignment
    match = re.search(var_name + r'\s*=\s*(\[.*\]);?', content, re.DOTALL)
    if not match:
        print(f"Warning: Variable {var_name} assignment not found in {filepath}")
        return []
    
    json_str = match.group(1)
    # Strip trailing commas that invalidate JSON
    json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
    
    try:
        return json.loads(json_str)
    except Exception as e:
        print(f"Error parsing JS dataset from {filepath}: {e}")
        return []

def build_index():
    index_data = []
    print("Indexing static pages for search...")
    for filename in sorted(os.listdir(backup_dir)):
        if filename.endswith(".html") and filename != "search.html":
            filepath = os.path.join(backup_dir, filename)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                html_content = f.read()

            parser = HTMLSearchIndexer()
            parser.feed(html_content)
            
            title = parser.title.strip() if parser.title else filename.replace(".html", "").title()
            title = re.sub(r'\s+', ' ', title)
            short_title = title.split("|")[0].strip()

            combined_text = " ".join(parser.text_content)
            combined_text = re.sub(r'\s+', ' ', combined_text).strip()

            index_data.append({
                "url": filename,
                "title": short_title,
                "fullTitle": title,
                "description": parser.description.strip(),
                "headings": parser.headings,
                "content": combined_text
            })
            print(f"  Indexed static page: {filename} ({len(combined_text)} chars)")

    # Index Martyrs Data
    print("Indexing martyrs database...")
    martyrs_filepath = os.path.join(backup_dir, "martyrs_data.js")
    martyrs_list = parse_js_data(martyrs_filepath, "martyrsData")
    for martyr in martyrs_list:
        if not martyr.get("name_bn"):
            continue
        # Construct search record
        page_id = martyr.get("page")
        name_bn = martyr.get("name_bn")
        name_en = martyr.get("name_en", "")
        desc_bn = martyr.get("desc_bn", "")
        desc_en = martyr.get("desc_en", "")
        year = str(martyr.get("year", ""))
        state_bn = martyr.get("state_bn", "")
        state_en = martyr.get("state_en", "")

        title = f"শহীদ কমরেড {name_bn} / Comrade {name_en}"
        full_title = f"শহীদ কমরেড {name_bn} ({year}) | Students' Federation of India - SFI Martyr"
        description = f"শহীদ কমরেড {name_bn} ({year}) - রাজ্য/জেলা: {state_bn}. SFI Martyr from {state_en}."
        content_txt = f"Martyr Comrade {name_en} from {state_en} year {year}. {desc_en} কমরেড {name_bn} জেলা/রাজ্য {state_bn} সাল {year}. {desc_bn}"
        
        index_data.append({
            "url": f"martyrs.html?id={page_id}",
            "title": title,
            "fullTitle": full_title,
            "description": description,
            "headings": ["শহীদ স্মরণ", name_bn, name_en, year, state_bn, state_en],
            "content": content_txt
        })
    print(f"  Indexed {len(martyrs_list)} martyrs.")

    # Index Press Releases
    print("Indexing press statements database...")
    press_filepath = os.path.join(backup_dir, "press_data.js")
    press_list = parse_js_data(press_filepath, "pressData")
    for press in press_list:
        if not press.get("title"):
            continue
        press_id = press.get("id")
        title = press.get("title")
        intro = press.get("intro", "")
        date = press.get("date", "")
        tags = press.get("tags", [])

        full_title = f"{title} | SFI West Bengal Press Release ({date})"
        description = f"প্রেস বিবৃতি - প্রকাশ: {date}. SFI Press Statement."
        content_txt = f"Press Release Statement Date {date} Tags {' '.join(tags)}. {title} {intro}"

        index_data.append({
            "url": f"press.html?id={press_id}",
            "title": title,
            "fullTitle": full_title,
            "description": description,
            "headings": ["প্রেস বিবৃতি", "Press Release", date] + tags,
            "content": content_txt
        })
    print(f"  Indexed {len(press_list)} press statements.")

    # Index SFI FAQs
    print("Indexing SFI History FAQs...")
    sfi_faqs = [
        {
            "url": "about.html#history",
            "title": "When SFI was founded? / এসএফআই কবে প্রতিষ্ঠিত হয়?",
            "fullTitle": "When was SFI founded? SFI Establishment Date | এসএফআই প্রতিষ্ঠা দিবস ও ইতিহাস",
            "description": "SFI (Students' Federation of India) was founded on December 27-30, 1970, at its first national conference in Thiruvananthapuram, Kerala. ভারতের ছাত্র ফেডারেশন (এসএফআই) ১৯৭০ সালের ২৭-৩০ ডিসেম্বর কেরলের তিরুবনন্তপুরমে অনুষ্ঠিত সর্বভারতীয় ছাত্র সম্মেলনে আনুষ্ঠানিকভাবে আত্মপ্রকাশ করে।",
            "headings": ["SFI Founding", "SFI History", "এসএফআই-এর প্রতিষ্ঠা", "ইতিহাস ও উৎপত্তি"],
            "content": "SFI foundation establishment date when was SFI founded. Students' Federation of India (SFI) was founded in Thiruvananthapuram, Kerala during the first national conference held from 27th to 30th December, 1970. Biman Bose was elected as the first General Secretary. এসএফআই-এর আনুষ্ঠানিক আত্মপ্রকাশ ২৭-৩০ ডিসেম্বর, ১৯৭০ সালে কেরলের তিরুবনন্তপুরমে অনুষ্ঠিত সর্বভারতীয় ছাত্র সম্মেলনে। পশ্চিমবঙ্গের প্রবাদপ্রতিম ছাত্রনেতা কমরেড বিমান বসু প্রথম সর্বভারতীয় সাধারণ সম্পাদক নির্বাচিত হন। প্রথম সভাপতি ছিলেন কমরেড সি. ভাস্করন।"
        },
        {
            "url": "about.html#history",
            "title": "Who founded SFI? / এসএফআই-এর প্রতিষ্ঠাতা কে?",
            "fullTitle": "Who founded SFI? SFI Founders | এসএফআই-এর প্রতিষ্ঠাতা ও প্রথম নেতৃত্ব",
            "description": "SFI was founded by progressive student leaders in 1970. Biman Bose was the first General Secretary, and C. Bhaskaran was the first President. এসএফআই-এর প্রথম সর্বভারতীয় সাধারণ সম্পাদক কমরেড বিমান বসু এবং প্রথম সর্বভারতীয় সভাপতি কমরেড সি. ভাস্করন।",
            "headings": ["SFI Founders", "First Leadership", "প্রতিষ্ঠাতা নেতৃবৃন্দ", "বিমান বসু"],
            "content": "SFI founders who founded SFI first leaders. Biman Bose, C. Bhaskaran, Shyamal Chakraborty, Subhash Chakraborty. Biman Bose was the first General Secretary. C. Bhaskaran was the first President of the Students' Federation of India. এসএফআই-এর প্রতিষ্ঠাতা নেতৃবৃন্দ বিমান বসু, সি. ভাস্করন, শ্যামল চক্রবর্তী, সুভাষ চক্রবর্তী। প্রথম সাধারণ সম্পাদক বিমান বসু এবং প্রথম সভাপতি সি. ভাস্করন।"
        },
        {
            "url": "about.html#slogan",
            "title": "What is SFI Slogan and Ideals? / এসএফআই-এর মূল স্লোগান ও আদর্শ কি?",
            "fullTitle": "SFI Slogan & Ideals: Independence, Democracy, Socialism | এসএফআই-এর স্লোগান ও আদর্শ: স্বাধীনতা, গণতন্ত্র, সমাজতন্ত্র",
            "description": "SFI's slogan is 'Independence, Democracy, Socialism' (স্বাধীনতা, গণতন্ত্র, সমাজতন্ত্র). It stands for scientific, secular, and equal education. এসএফআই-এর মূল স্লোগান স্বাধীনতা, গণতন্ত্র ও সমাজতন্ত্র। এটি ধর্মনিরপেক্ষ ও বৈজ্ঞানিক শিক্ষার অধিকার প্রতিষ্ঠার লড়াইয়ে বিশ্বাস করে।",
            "headings": ["SFI Slogan", "SFI Ideals", "স্বাধীনতা গণতন্ত্র সমাজতন্ত্র", "আদর্শ ও মূল স্লোগান"],
            "content": "SFI slogan ideals meaning Independence Democracy Socialism. স্বাধীনতা, গণতন্ত্র, সমাজতন্ত্র। Independence, Democracy, Socialism. SFI stands for free and compulsory education for all, classless society, scientific thinking, and secularism. এসএফআই শিক্ষাকে কেবল ডিগ্রি লাভের মাধ্যম নয়, বরং সামাজিক রূপান্তরের প্রথম ও প্রধান হাতিয়ার হিসেবে দেখে। আমাদের দর্শন গভীরভাবে মার্কসবাদ-লেনিনবাদ, ধর্মনিরপেক্ষতা, বৈজ্ঞানিক চিন্তাভাবনা এবং যে কোনো প্রকার সাম্প্রদায়িক ও সামন্ততান্ত্রিক শক্তির বিরোধিতার ওপর প্রতিষ্ঠিত।"
        },
        {
            "url": "about.html#flag",
            "title": "What does SFI Flag represent? / এসএফআই-এর পতাকা কেমন?",
            "fullTitle": "SFI Flag details and meaning | এসএফআই-এর পতাকা এবং তার তাৎপর্য",
            "description": "SFI's flag is white with a red five-pointed star in the center and the text 'STUDENTS' FEDERATION OF INDIA'. এসএফআই-এর পতাকা সাদা রঙের, যার মাঝখানে একটি পাঁচ-কোণা লাল তারা রয়েছে এবং উপরে লেখা রয়েছে 'STUDENTS' FEDERATION OF INDIA'।",
            "headings": ["SFI Flag", "SFI Symbol", "এসএফআই পতাকা", "লাল তারা"],
            "content": "SFI flag symbol meaning design red star white background. The flag is a white flag, with a ratio of 3:2, containing a red five-pointed star in the center and the words 'STUDENTS' FEDERATION OF INDIA' written on it. The white color represents peace and purity of students' struggle, and the red star represents revolutionary ideals and progress. এসএফআই-এর পতাকা সাদা রঙের, যার মাঝখানে একটি পাঁচ-কোণা লাল তারা রয়েছে এবং উপরে লেখা রয়েছে 'STUDENTS' FEDERATION OF INDIA'। সাদা রং ছাত্রদের সংগ্রামের পবিত্রতা ও শান্তিকামিতার প্রতীক এবং লাল তারা প্রগতি ও বিপ্লবের প্রতীক।"
        },
        {
            "url": "contact.html#office",
            "title": "Where is SFI Headquarters? / এসএফআই-এর সদর দফতর কোথায়?",
            "fullTitle": "SFI Headquarters: Central and West Bengal State Committee Office Address | এসএফআই সেন্ট্রাল অফিস ও রাজ্য দপ্তর",
            "description": "SFI Central Office is at 3, Canning Lane, New Delhi. West Bengal state office is at Dinesh Majumder Bhavan, Kolkata. এসএফআই কেন্দ্রীয় কার্যালয় নয়া দিল্লিতে (৩, ক্যানিং লেন) এবং পশ্চিমবঙ্গ রাজ্য দপ্তর কলকাতার দীনেশ মজুমদার ভবনে অবস্থিত।",
            "headings": ["SFI Head Office", "Headquarters", "State Office", "দীনেশ মজুমদার ভবন", "সদর দফতর"],
            "content": "SFI office address headquarters location phone email. SFI Central Committee Office: 3, Canning Lane, New Delhi - 110001. SFI West Bengal State Committee Office: Dinesh Majumder Bhavan, 79/3A, A. J. C. Bose Road, Kolkata, West Bengal, India - 700014. ফোন: +৯১-৮৯১০০৪৪১৩৮, +৯১-৯৯৩৩৬৪৬৫৫৬. ইমেল: state.committee.sfi.wb@gmail.com"
        },
        {
            "url": "state-committee.html",
            "title": "Who are SFI West Bengal State Secretary and President? / এসএফআই রাজ্য কমিটির সম্পাদক ও সভাপতি কে?",
            "fullTitle": "SFI West Bengal Leadership: Secretary Debanjan Dey & President Pranoy Karji | পশ্চিমবঙ্গ রাজ্য নেতৃত্বের তালিকা",
            "description": "SFI West Bengal State Secretary is Comrade Debanjan Dey, and State President is Comrade Pranoy Karji. এসএফআই পশ্চিমবঙ্গের বর্তমান রাজ্য সম্পাদক কমরেড দেবাঞ্জন দে এবং রাজ্য সভাপতি কমরেড প্রণয় কার্য্যী।",
            "headings": ["State Secretary", "State President", "Leadership", "দেবাঞ্জন দে", "প্রণয় কার্য্যী", "সৌভিক দাসবক্সী", "Souvik Dasboxi"],
            "content": "SFI West Bengal leaders State Secretary Debanjan Dey President Pranoy Karji Editor Souvik Dasboxi. SFI West Bengal State Committee is currently led by Comrade Debanjan Dey as State Secretary and Comrade Pranoy Karji as State President. এসএফআই পশ্চিমবঙ্গ রাজ্য কমিটির বর্তমান রাজ্য সম্পাদক কমরেড দেবাঞ্জন দে এবং রাজ্য সভাপতি কমরেড প্রণয় কার্য্যী। রাজ্য কমিটির পত্রিকা সম্পাদক কমরেড সৌভিক দাসবক্সী।"
        },
        {
            "url": "about.html#history",
            "title": "Who is the first secretary and first president of SFI? / এসএফআই-এর প্রথম সম্পাদক ও প্রথম সভাপতি কে?",
            "fullTitle": "SFI First General Secretary & President | এসএফআই-এর প্রথম সাধারণ সম্পাদক ও প্রথম সভাপতি",
            "description": "First General Secretary of SFI was Comrade Biman Bose, and first President was Comrade C. Bhaskaran. এসএফআই-এর প্রথম সর্বভারতীয় সাধারণ সম্পাদক কমরেড বিমান বসু এবং প্রথম সভাপতি কমরেড সি. ভাস্করন।",
            "headings": ["First Secretary", "First President", "Establishment", "বিমান বসু", "সি. ভাস্করন", "Biman Bose", "C. Bhaskaran"],
            "content": "SFI first secretary Biman Bose first president C. Bhaskaran. SFI was founded in 1970. প্রথম সাধারণ সম্পাদক বিমান বসু ও প্রথম সভাপতি কমরেড সি. ভাস্করন।"
        },
        {
            "url": "about.html#leadership",
            "title": "Who are SFI All India General Secretary and President? / এসএফআই সর্বভারতীয় সাধারণ সম্পাদক ও সভাপতি কে?",
            "fullTitle": "SFI All India Leadership: General Secretary Srijan Bhattacharyya & President Adarsh M. Saji | সর্বভারতীয় নেতৃত্ব",
            "description": "SFI All India General Secretary is Comrade Srijan Bhattacharyya, and All India President is Comrade Adarsh M. Saji. এসএফআই-এর বর্তমান সর্বভারতীয় সাধারণ সম্পাদক কমরেড সৃজন ভট্টাচার্য এবং সভাপতি কমরেড আদর্শ এম সাজি।",
            "headings": ["All India Secretary", "All India President", "Srijan Bhattacharyya", "Adarsh M. Saji", "সৃজন ভট্টাচার্য", "আদর্শ এম সাজি"],
            "content": "SFI All India leaders General Secretary Srijan Bhattacharyya President Adarsh M. Saji. SFI Central Committee leaders. সর্বভারতীয় সাধারণ সম্পাদক সৃজন ভট্টাচার্য এবং সর্বভারতীয় সভাপতি আদর্শ এম সাজি।"
        },
        {
            "url": "publications.html",
            "title": "What is Chhatra Sangram? / ছাত্রসংগ্রাম কি?",
            "fullTitle": "Chhatra Sangram: SFI West Bengal Official Mouthpiece | ছাত্রসংগ্রাম পত্রিকা ও প্রকাশনা",
            "description": "Chhatra Sangram is the official student mouthpiece and magazine of SFI West Bengal State Committee. ছাত্রসংগ্রাম হলো ভারতের ছাত্র ফেডারেশন (এসএফআই) পশ্চিমবঙ্গ রাজ্য কমিটির অফিশিয়াল মুখপত্র ও মাসিক পত্রিকা।",
            "headings": ["Chhatra Sangram", "Mouthpiece", "Publications", "ছাত্রসংগ্রাম", "প্রকাশনা"],
            "content": "Chhatra Sangram official organ magazine mouthpiece of SFI West Bengal. chhatrasangram.org. ছাত্রসংগ্রাম হলো pulsations-এর মতো প্রগতিশীল ছাত্র আন্দোলনের প্রধান মুখপাত্র ও পত্রিকা, যা শিক্ষার্থীদের গণতান্ত্রিক ও ধর্মনিরপেক্ষ মূল্যবোধে উদ্বুদ্ধ করে।"
        },
        {
            "url": "constitution.html#membership",
            "title": "How to join SFI? / এসএফআই-এর সদস্যপদ গ্রহণের যোগ্যতা কি?",
            "fullTitle": "SFI Membership Rules, Eligibility and Fees | এসএফআই-এর সদস্য হওয়া ও গঠনতন্ত্রের নিয়ম",
            "description": "Students aged 14 to 28 studying in recognized institutions can join SFI by agreeing to the constitution and paying fees. ১৪ থেকে ২৮ বছর বয়সী যেকোনো স্বীকৃত শিক্ষা প্রতিষ্ঠানের ছাত্র-ছাত্রী এসএফআই-এর সদস্য হতে পারেন।",
            "headings": ["Membership Rules", "How to Join SFI", "Join SFI", "সদস্যপদ শর্তাবলী", "এসএফআই সদস্যপদ"],
            "content": "SFI membership eligibility join rules fees. Age must be between 14 and 28. Must be a regular student or researcher in a recognized institution. Must accept SFI constitution and program, pay regular membership fees. সদস্যপদ লাভের জন্য বয়স ১৪ থেকে ২৮ বছর হতে হবে। যেকোনো স্বীকৃত শিক্ষা প্রতিষ্ঠানের নিয়মিত ছাত্র বা গবেষক হতে হবে। এসএফআই-এর কর্মসূচি ও গঠনতন্ত্র মেনে চলার অঙ্গীকার ও মাসিক চাঁদা নিয়মিত পরিশোধ করতে হবে।"
        }
    ]
    index_data.extend(sfi_faqs)
    print(f"  Indexed {len(sfi_faqs)} FAQs.")

    # Extract districtData from state-committee.html to include in search_data.js
    district_data_js = ""
    try:
        sc_path = os.path.join(backup_dir, "state-committee.html")
        if os.path.exists(sc_path):
            with open(sc_path, "r", encoding="utf-8", errors="ignore") as f:
                sc_content = f.read()
            start_idx = sc_content.find("const districtData = {")
            if start_idx != -1:
                end_idx = sc_content.find("};", start_idx)
                if end_idx != -1:
                    district_data_js = sc_content[start_idx:end_idx + 2]
                    # Rename the variable in search_data.js to searchDistrictData to be safe
                    district_data_js = district_data_js.replace("const districtData =", "const searchDistrictData =")
    except Exception as e:
        print(f"Error reading districtData: {e}")

    # Write search_data.js
    js_content = f"// Automatically generated search index. Do not edit directly.\nconst SEARCH_INDEX = {json.dumps(index_data, ensure_ascii=False, indent=2)};\n"
    if district_data_js:
        js_content += "\n" + district_data_js + "\n"

    with open(os.path.join(backup_dir, "search_data.js"), "w", encoding="utf-8") as f:
        f.write(js_content)
    print("search_data.js compiled successfully.\n")

def update_search_links():
    print("Updating search buttons across all HTML files to point to search.html...")
    for filename in os.listdir(backup_dir):
        if filename.endswith(".html"):
            filepath = os.path.join(backup_dir, filename)
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Simple link replace
            updated_content = re.sub(r'href=["\']/?docs/search["\']', 'href="search.html"', content)
            
            if updated_content != content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(updated_content)
                print(f"  Updated search link in: {filename}")

if __name__ == "__main__":
    build_index()
    update_search_links()
    print("Search system build steps executed successfully!")
