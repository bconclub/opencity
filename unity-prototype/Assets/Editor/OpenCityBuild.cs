using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

// Built-in pipeline proof of concept. No external runtime packages.
public static class OpenCityBuild
{
    const string ScenePath = "Assets/Scenes/OpenCityDrone.unity";
    const string DronePath = "Assets/Models/Drone/opencity-drone.fbx";

    public static void CreateScene()
    {
        Directory.CreateDirectory("Assets/Scenes");
        Directory.CreateDirectory("Assets/Materials");
        AssetDatabase.Refresh();
        var source = AssetDatabase.LoadAssetAtPath<GameObject>(DronePath);
        if (!source) throw new InvalidOperationException("Missing imported Blender drone: " + DronePath);
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        RenderSettings.ambientMode = AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = new Color(.55f, .68f, .78f);
        RenderSettings.ambientEquatorColor = new Color(.32f, .38f, .4f);
        RenderSettings.ambientGroundColor = new Color(.16f, .2f, .19f);
        RenderSettings.skybox = null;
        var drone = (GameObject)PrefabUtility.InstantiatePrefab(source);
        drone.name = "OpenCity original Blender drone";
        var renderers = drone.GetComponentsInChildren<Renderer>();
        if (renderers.Length == 0) throw new InvalidOperationException("Drone imported without renderers");
        var bounds = renderers[0].bounds;
        foreach (var r in renderers) bounds.Encapsulate(r.bounds);
        drone.transform.position = new Vector3(-bounds.center.x, .04f - bounds.min.y, -bounds.center.z);
        foreach (var r in renderers) { r.shadowCastingMode = ShadowCastingMode.On; r.receiveShadows = true; }
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Studio ground";
        ground.transform.localScale = Vector3.one * 2;
        var shader = Shader.Find("Standard");
        if (!shader) throw new InvalidOperationException("Built-in Standard shader unavailable");
        var materialPath = "Assets/Materials/StudioGround.mat";
        var mat = AssetDatabase.LoadAssetAtPath<Material>(materialPath);
        if (!mat) { mat = new Material(shader); AssetDatabase.CreateAsset(mat, materialPath); }
        mat.color = new Color(.105f,.16f,.17f);
        mat.SetFloat("_Glossiness", .15f);
        ground.GetComponent<Renderer>().sharedMaterial = mat;
        var key = new GameObject("Warm sunlight").AddComponent<Light>();
        key.type = LightType.Directional; key.intensity = 1.7f;
        key.color = new Color(1,.93f,.81f); key.shadows = LightShadows.Soft;
        key.transform.rotation = Quaternion.Euler(45,-35,0);
        var fill = new GameObject("Cool fill").AddComponent<Light>();
        fill.type = LightType.Directional; fill.intensity = .65f;
        fill.color = new Color(.6f,.78f,1); fill.transform.rotation = Quaternion.Euler(25,145,0);
        var camera = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener)).GetComponent<Camera>();
        camera.tag = "MainCamera"; camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(.055f,.09f,.115f);
        camera.fieldOfView = 38; camera.nearClipPlane = .01f; camera.farClipPlane = 100;
        var focus = new Vector3(0, bounds.size.y * .5f + .04f, 0);
        var radius = Mathf.Max(bounds.size.x,bounds.size.z,1);
        camera.transform.position = focus + new Vector3(1.15f,.85f,-1.4f)*radius;
        camera.transform.LookAt(focus);
        QualitySettings.shadowDistance = 30;
        QualitySettings.antiAliasing = 2;
        EditorSceneManager.SaveScene(scene, ScenePath);
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath,true) };
        PlayerSettings.companyName = "OpenCity";
        PlayerSettings.productName = "OpenCity Blender Drone Preview";
        PlayerSettings.defaultWebScreenWidth = 1280;
        PlayerSettings.defaultWebScreenHeight = 720;
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        AssetDatabase.SaveAssets();
        Debug.Log("OPENCITY_SCENE_READY " + ScenePath + " drone bounds " + bounds.size);
    }

    public static void BuildWebGL()
    {
        CreateScene();
        var destination = Environment.GetEnvironmentVariable("OPENCITY_WEBGL_OUTPUT");
        if (string.IsNullOrWhiteSpace(destination)) destination = "D:/CodexTools/Unity/Builds/OpenCityDrone";
        Directory.CreateDirectory(destination);
        var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions {
            scenes = new[] { ScenePath }, locationPathName = destination,
            target = BuildTarget.WebGL, options = BuildOptions.None
        });
        if (report.summary.result != BuildResult.Succeeded)
            throw new InvalidOperationException("OpenCity WebGL build failed: " + report.summary.result);
        Debug.Log("OPENCITY_WEBGL_READY " + destination + " bytes " + report.summary.totalSize);
    }
}
