import {
  faArchive,
  faBook,
  faBriefcase,
  faBuilding,
  faCode,
  faDatabase,
  faFlask,
  faFolder,
  faFolderOpen,
  faGear,
  faGraduationCap,
  faHardDrive,
  faImage,
  faLayerGroup,
  faLock,
  faMap,
  faPalette,
  faPeopleGroup,
  faRocket,
  faServer,
  faShieldHalved,
  faStar,
  faTag,
  faWrench,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

export interface FolderIconOption {
  key: string;
  label: string;
  icon: IconDefinition;
}

// Keys mirror backend/src/WikiSelf/Services/FolderIconCatalog.cs — keep both lists in sync.
export const FOLDER_ICONS: FolderIconOption[] = [
  { key: "folder", label: "Klasör", icon: faFolder },
  { key: "folder-open", label: "Açık Klasör", icon: faFolderOpen },
  { key: "briefcase", label: "Çanta", icon: faBriefcase },
  { key: "box-archive", label: "Arşiv", icon: faArchive },
  { key: "book", label: "Kitap", icon: faBook },
  { key: "building", label: "Bina", icon: faBuilding },
  { key: "code", label: "Kod", icon: faCode },
  { key: "database", label: "Veritabanı", icon: faDatabase },
  { key: "flask", label: "Laboratuvar", icon: faFlask },
  { key: "gear", label: "Ayarlar", icon: faGear },
  { key: "graduation-cap", label: "Eğitim", icon: faGraduationCap },
  { key: "hard-drive", label: "Disk", icon: faHardDrive },
  { key: "image", label: "Görsel", icon: faImage },
  { key: "layer-group", label: "Katmanlar", icon: faLayerGroup },
  { key: "lock", label: "Kilit", icon: faLock },
  { key: "map", label: "Harita", icon: faMap },
  { key: "palette", label: "Palet", icon: faPalette },
  { key: "people-group", label: "Ekip", icon: faPeopleGroup },
  { key: "rocket", label: "Roket", icon: faRocket },
  { key: "server", label: "Sunucu", icon: faServer },
  { key: "shield-halved", label: "Güvenlik", icon: faShieldHalved },
  { key: "star", label: "Yıldız", icon: faStar },
  { key: "tag", label: "Etiket", icon: faTag },
  { key: "wrench", label: "Araç", icon: faWrench },
];

const FOLDER_ICONS_BY_KEY: Record<string, FolderIconOption> = Object.fromEntries(
  FOLDER_ICONS.map((option) => [option.key, option]),
);

const DEFAULT_ICON_KEY = "folder";
const DEFAULT_OPEN_ICON_KEY = "folder-open";

export function getFolderIcon(key: string | null | undefined, isOpen: boolean): IconDefinition {
  if (!key) {
    return FOLDER_ICONS_BY_KEY[isOpen ? DEFAULT_OPEN_ICON_KEY : DEFAULT_ICON_KEY].icon;
  }
  return FOLDER_ICONS_BY_KEY[key]?.icon ?? FOLDER_ICONS_BY_KEY[isOpen ? DEFAULT_OPEN_ICON_KEY : DEFAULT_ICON_KEY].icon;
}
