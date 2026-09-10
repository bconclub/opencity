$ErrorActionPreference='Stop'
$source=[IO.Path]::GetFullPath('C:\Users\user\.cache\huggingface')
$destination=[IO.Path]::GetFullPath('D:\CodexTools\ModelCache\huggingface')
if($source -ne 'C:\Users\user\.cache\huggingface' -or $destination -ne 'D:\CodexTools\ModelCache\huggingface'){throw 'Unexpected path'}
if((Get-Item -LiteralPath $source).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Source is already a link; inspect before proceeding'}
if(Test-Path -LiteralPath $destination){throw 'Destination exists; inspect before merging'}
$before=@(Get-ChildItem -LiteralPath $source -Recurse -Force)
if($before | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}){throw 'Nested links require separate migration'}
New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $destination -Recurse -Force
$files=@($before | Where-Object {!$_.PSIsContainer})
foreach($file in $files){
 $relative=$file.FullName.Substring($source.Length+1)
 $copy=Join-Path $destination $relative
 if(!(Test-Path -LiteralPath $copy) -or (Get-Item -LiteralPath $copy).Length -ne $file.Length){throw "Copy mismatch: $relative"}
 if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash){throw "Hash mismatch: $relative"}
}
$after=@(Get-ChildItem -LiteralPath $source -Recurse -File -Force)
if($after.Count -ne $files.Count){throw 'Source changed during copy'}
foreach($file in $after){$old=$files | Where-Object FullName -eq $file.FullName;if($file.Length -ne $old.Length -or $file.LastWriteTimeUtc -ne $old.LastWriteTimeUtc){throw 'Source changed during verification'}}
# Both absolute paths verified above, and every copied file was hash checked.
Remove-Item -LiteralPath $source -Recurse -Force
New-Item -ItemType Junction -Path $source -Target $destination | Out-Null
[Environment]::SetEnvironmentVariable('HF_HOME',$destination,'User')
[Environment]::SetEnvironmentVariable('HF_HUB_CACHE',(Join-Path $destination 'hub'),'User')
[Environment]::SetEnvironmentVariable('HF_XET_CACHE',(Join-Path $destination 'xet'),'User')
$probe=Join-Path $source '.migration-probe'
[IO.File]::WriteAllText($probe,'verified')
if(!(Test-Path -LiteralPath (Join-Path $destination '.migration-probe'))){throw 'Junction verification failed'}
Remove-Item -LiteralPath $probe
[pscustomobject]@{FilesVerified=$files.Count;Bytes=($files | Measure-Object Length -Sum).Sum;Destination=$destination;Link=(Get-Item -LiteralPath $source).LinkType;FreeCGB=[math]::Round((Get-PSDrive C).Free/1GB,2)} | ConvertTo-Json
