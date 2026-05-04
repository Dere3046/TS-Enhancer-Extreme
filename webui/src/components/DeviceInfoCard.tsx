import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import {
  Smartphone,
  Cpu,
  Shield,
  Info,
  Box,
} from 'lucide-react'

function AndroidIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0225 3.503C15.5902 8.479 13.8532 8.1422 12 8.1422c-1.8532 0-3.5902.3368-5.1366.9455L4.841 5.5847a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589.3432 18.6617h23.3136c0-4.0028-2.3457-7.475-5.7754-9.3403" />
    </svg>
  )
}

interface DeviceInfoCardProps {
  deviceName?: string
  androidVersion?: string
  kernelVersion?: string
  selinuxStatus?: string
  architecture?: string
}

export function DeviceInfoCard({
  deviceName = '',
  androidVersion = '',
  kernelVersion = '',
  selinuxStatus = '',
  architecture = '',
}: DeviceInfoCardProps) {
  const { colors } = useTheme()
  const { t } = useI18n()

  const items = [
    {
      icon: <Smartphone className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />,
      label: t('home.device_model'),
      value: deviceName || 'Unknown Device',
    },
    {
      icon: <AndroidIcon className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />,
      label: t('home.android_sdk'),
      value: androidVersion || 'Unknown',
    },
    {
      icon: <Cpu className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />,
      label: 'Kernel',
      value: kernelVersion || 'Unknown',
    },
    {
      icon: <Shield className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />,
      label: 'SELinux',
      value: selinuxStatus || 'Unknown',
    },
    {
      icon: <Box className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />,
      label: t('home.abi'),
      value: architecture || 'Unknown',
    },
  ]

  return (
    <div
      className="rounded-3xl overflow-hidden p-6"
      style={{
        backgroundColor: colors.surfaceContainerLow,
        boxShadow: `0 1px 2px ${colors.shadow}20`,
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <Info className="w-5 h-5" style={{ color: colors.onSurfaceVariant }} />
        <h2
          className="text-lg font-medium"
          style={{ color: colors.onSurface }}
        >
          {t('card.home.device_info')}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: colors.surfaceContainerHighest }}
            >
              {item.icon}
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-medium"
                style={{ color: colors.onSurface }}
              >
                {item.label}
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: colors.onSurfaceVariant }}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
