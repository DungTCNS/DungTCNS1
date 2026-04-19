import { useState, useMemo, useEffect } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import personnelData from './data.json';
import { motion, AnimatePresence } from 'motion/react';

function getInitials(name: string) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const colors = [
  'bg-[#107c41]', 'bg-[#0078d4]', 'bg-[#d83b01]', 
  'bg-[#5c2d91]', 'bg-[#008272]', 'bg-[#a4262c]',
  'bg-[#bf0077]', 'bg-[#004b50]'
];

function getColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const removeAccents = (str: string) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const getAssetPath = (filename: string) => {
  if (!filename) return '';
  
  // Auto-convert Google Drive viewer links to direct image links
  if (filename.includes('drive.google.com/file/d/')) {
    const match = filename.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }

  if (filename.startsWith('http') || filename.startsWith('data:')) {
    return filename; // For direct external URLs or Base64 data
  }
  // Always use explicit relative path for images so it works everywhere (Vercel, GitHub Pages, etc.)
  // regardless of subpath.
  return `./${filename}`;
};

const getImageSource = (person: any) => {
  const imgData = person.ImageFileName || person['Hình ảnh'];
  if (!imgData || imgData === '#VALUE!' || imgData === 'Không') return null;
  return imgData;
};

const Avatar = ({ person, className }: { person: any, className: string }) => {
  const [error, setError] = useState(false);
  const imageSrc = getImageSource(person);
  const showImage = imageSrc && !error;

  if (showImage) {
    return (
      <img 
        src={getAssetPath(imageSrc)} 
        alt={person['Họ  và tên']} 
        className={className} 
        onError={() => setError(true)}
      />
    );
  }
  
  return (
    <div className={`flex items-center justify-center text-white font-bold text-lg ${getColorForName(person['Họ  và tên'])} ${className}`}>
      {getInitials(person['Họ  và tên'])}
    </div>
  );
};

const ProfileImage = ({ person }: { person: any }) => {
  const [error, setError] = useState(false);
  const imageSrc = getImageSource(person);
  const showImage = imageSrc && !error;

  if (showImage) {
    return (
      <img 
        src={getAssetPath(imageSrc)} 
        alt="Ảnh nhân viên" 
        className="w-full h-full object-cover border border-gray-200"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <span className="text-gray-400 text-sm font-medium">ẢNH 3x4</span>
  );
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return personnelData;
    const searchNormalized = removeAccents(searchTerm).trim();
    
    const filtered = personnelData.filter(p => {
      const msnv = removeAccents(p['MSNV']);
      const name = removeAccents(p['Họ  và tên']);
      const dept = removeAccents(p['Bộ phận']);
      const title = removeAccents(p['Chức vụ']);
      
      return msnv.includes(searchNormalized) || 
             name.includes(searchNormalized) ||
             dept.includes(searchNormalized) ||
             title.includes(searchNormalized);
    });

    // Sort to prioritize matched names
    return filtered.sort((a, b) => {
      const nameA = removeAccents(a['Họ  và tên']);
      const nameB = removeAccents(b['Họ  và tên']);
      
      const getScore = (name: string) => {
        if (name === searchNormalized) return 100;
        
        const words = name.split(' ');
        // Lấy tên chính cuối cùng (ví dụ: "Đặng Văn Đức" -> Tên chính là "đức")
        const givenName = words[words.length - 1] || '';
        
        if (givenName === searchNormalized) return 50; 
        if (givenName.startsWith(searchNormalized)) return 40;
        if (name.startsWith(searchNormalized)) return 30;
        if (words.some(w => w === searchNormalized)) return 20;
        if (words.some(w => w.startsWith(searchNormalized))) return 10;
        if (name.includes(searchNormalized)) return 5;
        
        return 0; // Not a name match (matched by Dept, Title, MSNV instead)
      };

      return getScore(nameB) - getScore(nameA);
    });
  }, [searchTerm]);

  useEffect(() => {
    // Tự động chọn luôn người đầu tiên khi danh sách lọc thay đổi 
    // để được "hiển thị ngay" profile ở khung bên phải
    if (filteredData.length > 0) {
      if (searchTerm) {
        setSelectedPerson(filteredData[0]); // Luôn nhảy đến best match khi nhập chữ
      } else if (!selectedPerson) {
        setSelectedPerson(filteredData[0]); // Hoặc khi lần đầu tải trang
      }
    } else {
      setSelectedPerson(null);
    }
  }, [filteredData, searchTerm]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 font-sans text-gray-800">
      
      {/* SIDEBAR */}
      <div className="w-[360px] flex-shrink-0 flex flex-col bg-white border-r border-gray-200 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.03)] relative">
        
        {/* Search Box - Moved to absolute top */}
        <div className="p-4 pt-6 border-b border-gray-100 bg-white shadow-sm z-20 sticky top-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="w-full bg-gray-50 text-[14px] text-gray-800 placeholder-gray-500 rounded-lg pl-9 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all border border-gray-200"
              placeholder="Tìm theo tên n.viên, mã NV, phòng ban hoặc đội..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Header */}
        <div className="pt-6 pb-5 flex flex-col items-center border-b border-gray-100 relative z-10">
          <div className="relative mb-1">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" stroke="#00529c" strokeWidth="4" fill="white"/>
              <path d="M50 12 L56 44 L88 50 L56 56 L50 88 L44 56 L12 50 L44 44 Z" fill="#ee2724" />
              <path d="M50 20 L54 46 L80 50 L54 54 L50 80 L46 54 L20 50 L46 46 Z" fill="#00529c" />
              <path d="M50 30 L52 48 L70 50 L52 52 L50 70 L48 52 L30 50 L48 48 Z" fill="#ffb81c" />
            </svg>
          </div>
          <div className="text-[#00529c] font-black text-[15px] tracking-[0.2em] mt-1">EVN</div>
          
          <div className="text-2xl font-black mt-2 tracking-tighter">
            <span className="text-[#00529c]">EVN</span>
            <span className="text-[#ee2724]">HCMC</span>
          </div>
          
          <div className="text-[12px] font-bold text-[#00529c] mt-2 uppercase tracking-wide">
            Tổng công ty điện lực TP.HCM
          </div>
          <div className="text-[12px] font-bold text-[#00529c] mt-0.5 uppercase tracking-wide">
            Công ty điện lực Vũng Tàu
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ffffff] custom-scrollbar">
          {filteredData.map((person) => {
            const isSelected = selectedPerson?.['MSNV'] === person['MSNV'];
            return (
              <div
                key={person['MSNV']}
                onClick={() => setSelectedPerson(person)}
                className={`p-3 rounded-xl flex items-center gap-4 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#f4f8ff] border border-[#dbeaffe] shadow-sm'
                    : 'bg-white border border-gray-50 hover:bg-gray-50'
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-blue-600 rounded-r-md"></div>
                )}
                
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                  <Avatar person={person} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                  <div className={`font-bold text-[13.5px] truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                    {person['Họ  và tên']}
                  </div>
                  <div className="text-[12.5px] text-gray-500 truncate mt-[1px]">
                    {person['Chức vụ'] || 'Nhân viên'}
                  </div>
                  <div className="inline-block mt-1 px-1.5 py-[2px] bg-gray-100 border border-gray-200 rounded text-[10.5px] text-gray-600 font-medium tracking-wide">
                    {person['MSNV']}
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredData.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              Không tìm thấy nhân viên phù hợp.
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 h-screen overflow-y-auto bg-gray-100 p-6 md:p-10 relative custom-scrollbar">
        <AnimatePresence mode="wait">
          {selectedPerson ? (
            <motion.div 
              key={selectedPerson['MSNV']}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-white mx-auto shadow-md border border-gray-300 max-w-4xl pt-10 pb-12 px-12 relative min-h-[800px]"
            >
              <div className="font-nimbus text-[15.5px] text-black">
                {/* Headers */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="font-bold uppercase tracking-wide">CÔNG TY ĐIỆN LỰC VŨNG TÀU</div>
                    <div className="font-bold underline uppercase tracking-wide">QUẢN LÝ NHÂN SỰ</div>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold uppercase mb-4 tracking-wider">THÔNG TIN NGƯỜI LAO ĐỘNG</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-8 mb-6">
                  {/* Left Column Data */}
                  <div className="flex-1">
                    <table className="w-full border-collapse text-[14.5px]">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 w-40 font-semibold text-gray-700">Mã Nhân viên</td>
                          <td className="py-1.5 w-48 font-bold text-blue-800">{selectedPerson['MSNV']}</td>
                          <td className="py-1.5 w-32 font-semibold text-gray-700">Tên Nhân viên</td>
                          <td className="py-1.5 font-bold text-blue-800 text-[15.5px] uppercase">{selectedPerson['Họ  và tên']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Ngày sinh</td>
                          <td className="py-1.5">{selectedPerson['Ngày, tháng, năm sinh']}</td>
                          <td className="py-1.5 font-semibold text-gray-700">Giới tính</td>
                          <td className="py-1.5">{selectedPerson['Giới tính']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Tuổi</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Tuổi']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Quê quán</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Quê quán']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Ngày vào Ngành điện</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Ngày vào Ngành điện']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Chức vụ, CV</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Chức vụ']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Bộ phận</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Bộ phận']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Năm công tác</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Năm công tác']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Trình độ hiện tại</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Trình độ']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Ngành đào tạo</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Ngành đào tạo']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Năm tốt nghiệp</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Năm tốt nghiệp']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Trường cấp bằng</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Trường cấp bằng']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">LH đào tạo</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Loại hình đào tạo']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Số điện thoại</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Số điện thoại']}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-semibold text-gray-700">Email</td>
                          <td className="py-1.5" colSpan={3}>{selectedPerson['Email']}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column Image */}
                  <div className="w-full md:w-[180px] flex flex-col items-center flex-shrink-0 pt-2">
                    <div className="w-[150px] h-[200px] border border-gray-400 bg-gray-50 flex items-center justify-center p-1.5 mb-2 shadow-sm">
                       <ProfileImage person={selectedPerson} />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <table className="w-full border-collapse text-[14.5px]">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 w-64 font-semibold text-gray-700">Thang, bảng lương</td>
                        <td className="py-1.5">{selectedPerson['Bậc lương']}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 font-semibold text-gray-700">Trình độ vào ngành điện</td>
                        <td className="py-1.5">{selectedPerson['Trình độ khi vào ngành điện']}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 font-semibold text-gray-700">Ngày vào Đảng</td>
                        <td className="py-1.5">{selectedPerson['Năm vào đảng']}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 font-semibold text-gray-700">Trình độ chính trị</td>
                        <td className="py-1.5">{selectedPerson['Trình độ chính trị']}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-1.5 font-semibold text-gray-700">Trình độ ngoại ngữ</td>
                        <td className="py-1.5">{selectedPerson['Trình độ ngoài ngữ']}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} className="py-2">
                          <div className="font-semibold text-gray-700 mb-1 mt-1">Quá trình công tác:</div>
                          <div className="bg-gray-50 p-4 border border-gray-200 min-h-[90px] whitespace-pre-line text-gray-800 leading-relaxed font-nimbus text-[15.5px]">
                            {selectedPerson['Qúa trình công tác'] || ''}
                          </div>
                        </td>
                      </tr>
                      {selectedPerson['Kỷ luật'] && selectedPerson['Kỷ luật'] !== 'Không' && (
                      <tr>
                        <td colSpan={2} className="py-2 mt-2 block">
                          <div className="font-semibold text-red-700 mb-1">Kỷ luật - Cảnh cáo:</div>
                          <div className="bg-red-50/50 p-3 border border-red-200 text-red-800 font-nimbus rounded-sm">
                            {selectedPerson['Kỷ luật']}
                          </div>
                        </td>
                      </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            </motion.div>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 flex-col">
              <UserIcon size={64} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Chưa có nhân sự nào được chọn</p>
              <p className="text-sm mt-1">Vui lòng chọn một nhân viên từ danh sách bên trái.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
