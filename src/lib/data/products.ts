export interface Product {
	id: string;
	name: string;
	category: string;
	tags: string[];
	description: string;
	detailedDescription: string;
	icon: string;
	iconColor: string;
	liveDemoUrl?: string;
	downloadUrl?: string;
	fileSize?: string;
	fileType?: string;
	downloadsCount?: number;
	lastUpdated: string;
	wpVersion: string;
	phpVersion: string;
	author: string;
	rating: {
		average: number;
		count: number;
		distribution: {
			5: number;
			4: number;
			3: number;
			2: number;
			1: number;
		};
	};
	slideshowImages: string[];
	guides: { title: string; content: string }[];
	faqs: { question: string; answer: string }[];
	changelogs: { version: string; date: string; changes: string[] }[];
}

export const products: Product[] = [
	{
		id: 'wp-chat-assistant',
		name: 'WP Chat Assistant',
		category: 'WordPress Plugin',
		tags: ['helpdesk', 'tool', 'advance'],
		description:
			'Tích hợp chatbot AI hỗ trợ khách hàng tự động vào website WordPress chỉ trong 5 phút.',
		detailedDescription:
			'WP Chat Assistant giúp tự động hóa khâu chăm sóc khách hàng. Plugin sử dụng AI trả lời tức thì các câu hỏi thường gặp, hỗ trợ WooCommerce tra cứu đơn hàng nhanh chóng và cho phép tùy biến giao diện widget linh hoạt theo thương hiệu.',
		icon: 'icon-[lucide--message-square-text]',
		iconColor: 'text-emerald-500 bg-emerald-500/10',
		liveDemoUrl: 'https://demo.wpchatassistant.com',
		downloadUrl: 'https://files.minigameshub.com/plugins/wp-chat-assistant-v1.2.0.zip',
		fileSize: '4.8 MB',
		fileType: 'ZIP Plugin',
		downloadsCount: 1540,
		lastUpdated: '10/07/2026',
		wpVersion: '6.0 hoặc cao hơn',
		phpVersion: '7.4 hoặc cao hơn',
		author: 'Mini Games Hub Team',
		rating: {
			average: 4.8,
			count: 148,
			distribution: {
				5: 125,
				4: 15,
				3: 5,
				2: 2,
				1: 1
			}
		},
		slideshowImages: [
			'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
			'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
		],
		guides: [
			{
				title: 'Bước 1: Cài đặt Plugin',
				content:
					'Tải tệp ZIP của plugin về máy. Trong trang quản trị WordPress, truy cập Plugins > Add New > Upload Plugin, chọn tệp ZIP và nhấn Install Now, sau đó kích hoạt plugin.'
			},
			{
				title: 'Bước 2: Cấu hình API Key',
				content:
					'Truy cập vào menu Chat Assistant mới xuất hiện ở thanh bên quản trị. Nhập mã API Key của bạn từ bảng điều khiển AI Hub để kích hoạt bộ nhớ thông minh cho bot.'
			},
			{
				title: 'Bước 3: Tải lên dữ liệu tài liệu',
				content:
					'Trong tab "Knowledge Base", bạn có thể tải lên các tệp tin PDF hướng dẫn hoặc nhập trực tiếp các câu hỏi thường gặp để dạy cho AI cách trả lời khách hàng.'
			},
			{
				title: 'Bước 4: Tùy chỉnh Widget hiển thị',
				content:
					'Chuyển sang tab "Design Settings" để cấu hình màu sắc, vị trí hiển thị (trái/phải), lời chào mặc định và ảnh đại diện cho chatbot.'
			}
		],
		faqs: [
			{
				question: 'Plugin này có làm chậm website của tôi không?',
				answer:
					'Hoàn toàn không. Plugin sử dụng API tải không đồng bộ (Asynchronous loading), mọi tác vụ xử lý ngôn ngữ và suy luận AI đều diễn ra trên máy chủ đám mây của chúng tôi, không gây tải cho hosting của bạn.'
			},
			{
				question: 'Tôi có thể kết nối với WooCommerce để tra cứu đơn hàng không?',
				answer:
					'Có. Từ phiên bản 1.1.0, bạn chỉ cần cấp quyền đọc đơn hàng, bot có thể tự động trả lời khách hàng về tình trạng vận chuyển khi họ cung cấp mã đơn hàng chính xác.'
			},
			{
				question: 'Tôi có thể dùng API Key miễn phí không?',
				answer:
					'Chúng tôi tặng sẵn 10,000 tokens miễn phí cho mọi tài khoản đăng ký mới. Sau khi hết hạn mức, bạn có thể mua thêm gói nạp tiền theo lượng sử dụng thực tế.'
			}
		],
		changelogs: [
			{
				version: 'v1.2.0',
				date: '10/07/2026',
				changes: [
					'Nâng cấp giao diện quản trị Admin mượt mà hơn theo chuẩn thiết kế tối giản.',
					'Tối ưu hóa thời gian phản hồi của chatbot nhanh hơn 30%.',
					'Sửa lỗi xung đột với plugin WP Rocket khi cache trang.'
				]
			},
			{
				version: 'v1.1.0',
				date: '20/06/2026',
				changes: [
					'Hỗ trợ tích hợp sâu với WooCommerce tra cứu đơn hàng tự động.',
					'Thêm tính năng tùy chọn xuất lịch sử chat của khách hàng dạng CSV.'
				]
			}
		]
	},
	{
		id: 'digital-card-builder',
		name: 'Digital Card Builder',
		category: 'CMS Tool',
		tags: ['digital', 'team', 'social'],
		description:
			'Công cụ thiết kế danh thiếp điện tử thông minh và tạo trang cá nhân Bio chuyên nghiệp.',
		detailedDescription:
			'Digital Card Builder giúp tạo nhanh danh thiếp số thông minh và trang cá nhân (Link-in-bio). Công cụ hỗ trợ kéo thả chỉnh sửa trực quan, tạo mã QR liên kết động, và tích hợp bộ phân tích thống kê lượt click thời gian thực.',
		icon: 'icon-[lucide--contact-2]',
		iconColor: 'text-sky-500 bg-sky-500/10',
		liveDemoUrl: 'https://cards.minigameshub.com',
		downloadUrl: 'https://files.minigameshub.com/tools/digital-card-builder-v2.0.1.zip',
		fileSize: '12.5 MB',
		fileType: 'ZIP Source',
		downloadsCount: 920,
		lastUpdated: '05/07/2026',
		wpVersion: 'Không yêu cầu (Standalone CMS)',
		phpVersion: '8.1 hoặc cao hơn',
		author: 'Mini Games Hub Team',
		rating: {
			average: 4.6,
			count: 84,
			distribution: {
				5: 62,
				4: 15,
				3: 4,
				2: 2,
				1: 1
			}
		},
		slideshowImages: [
			'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
			'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80'
		],
		guides: [
			{
				title: 'Bước 1: Giải nén mã nguồn',
				content:
					'Tải mã nguồn về và giải nén trên thư mục webroot của hosting hoặc server chạy PHP 8.1 trở lên.'
			},
			{
				title: 'Bước 2: Tạo Cơ sở dữ liệu',
				content:
					'Tạo một DB MySQL trống. Truy cập địa chỉ trang web của bạn để bắt đầu trình cài đặt tự động (Web Installer), nhập thông tin DB.'
			},
			{
				title: 'Bước 3: Thiết lập tài khoản Admin',
				content:
					'Khai báo thông tin tài khoản quản trị hệ thống tối cao (Super Admin) và cấu hình SMTP gửi mail xác nhận.'
			}
		],
		faqs: [
			{
				question: 'Công cụ này có hỗ trợ xuất mã QR không?',
				answer:
					'Có. Hệ thống tự động tạo mã QR động cho từng danh thiếp cá nhân. Bạn có thể tải mã QR dưới định dạng PNG hoặc SVG chất lượng cao để in ấn lên danh thiếp vật lý.'
			},
			{
				question: 'Tôi có thể tự tạo domain riêng (Custom Domain) cho mỗi card không?',
				answer:
					'Tính năng Custom Domain được hỗ trợ trong gói Advance. Người dùng có thể cấu hình trỏ CNAME về hệ thống của bạn để dùng tên miền riêng.'
			}
		],
		changelogs: [
			{
				version: 'v2.0.1',
				date: '05/07/2026',
				changes: [
					'Thêm 5 mẫu giao diện Glassmorphism mới siêu đẹp.',
					'Sửa lỗi hiển thị mã QR trên trình duyệt Safari di động.'
				]
			}
		]
	},
	{
		id: 'wp-sudoku-game',
		name: 'WP Sudoku Game',
		category: 'WordPress Plugin',
		tags: ['game', 'tool'],
		description:
			'Tích hợp bảng trò chơi trí tuệ Sudoku hấp dẫn giữ chân người đọc trên website của bạn.',
		detailedDescription:
			'WP Sudoku Game giúp chèn nhanh bảng Sudoku chuẩn quốc tế vào website. Hỗ trợ tạo bảng ngẫu nhiên theo 4 cấp độ khó, tối ưu hóa giao diện di động cảm ứng mượt mà và tự động tích hợp bảng xếp hạng điểm số.',
		icon: 'icon-[lucide--grid-3x3]',
		iconColor: 'text-amber-500 bg-amber-500/10',
		liveDemoUrl: 'https://demo.wpsudoku.com',
		downloadUrl: 'https://files.minigameshub.com/plugins/wp-sudoku-game-v1.0.0.zip',
		fileSize: '2.1 MB',
		fileType: 'ZIP Plugin',
		downloadsCount: 2150,
		lastUpdated: '15/06/2026',
		wpVersion: '5.5 hoặc cao hơn',
		phpVersion: '7.2 hoặc cao hơn',
		author: 'Mini Games Hub Team',
		rating: {
			average: 4.9,
			count: 310,
			distribution: {
				5: 285,
				4: 20,
				3: 3,
				2: 1,
				1: 1
			}
		},
		slideshowImages: [
			'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
			'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
			'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80'
		],
		guides: [
			{
				title: 'Bước 1: Cài đặt và Kích hoạt',
				content: 'Kích hoạt plugin trong thư mục Plugins của WordPress.'
			},
			{
				title: 'Bước 2: Sử dụng Shortcode',
				content:
					'Chèn đoạn shortcode `[wp_sudoku]` vào bất kỳ bài viết hoặc trang nào bạn muốn hiển thị trò chơi.'
			}
		],
		faqs: [
			{
				question: 'Game có tương thích với thiết bị di động không?',
				answer:
					'Hoàn toàn tương thích. Bàn phím số cảm ứng được tối ưu lớn, dễ bấm trên màn hình điện thoại.'
			}
		],
		changelogs: [
			{
				version: 'v1.0.0',
				date: '15/06/2026',
				changes: ['Phiên bản đầu tiên ra mắt với 4 cấp độ khó và tính năng tính giờ chơi.']
			}
		]
	}
];
